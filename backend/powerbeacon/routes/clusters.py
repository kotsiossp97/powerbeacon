import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from powerbeacon.core.deps import CurrentUser, SessionDep
from powerbeacon.models.agents import Agent
from powerbeacon.models.clusters import (
    Cluster,
    ClusterCreate,
    ClusterDetailPublic,
    ClusterPublic,
    ClustersPublic,
    ClusterUpdate,
)
from powerbeacon.models.devices import Device
from powerbeacon.models.generic import Message
from powerbeacon.services.inventory_service import can_manage_owned_resource, serialize_cluster
from powerbeacon.services.wake_service import wake_service

router = APIRouter(prefix="/clusters", tags=["Clusters"])


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _get_cluster(session: SessionDep, cluster_id: uuid.UUID) -> Cluster | None:
    statement = (
        select(Cluster)
        .where(Cluster.id == cluster_id)
        .options(
            selectinload(Cluster.owner),
            selectinload(Cluster.devices).selectinload(Device.owner),
            selectinload(Cluster.devices).selectinload(Device.cluster),
            selectinload(Cluster.devices).selectinload(Device.agents),
            selectinload(Cluster.agents).selectinload(Agent.cluster),
            selectinload(Cluster.agents).selectinload(Agent.devices),
        )
    )
    return session.exec(statement).first()


def _get_devices(session: SessionDep, device_ids: list[uuid.UUID]) -> list[Device]:
    if not device_ids:
        return []

    statement = (
        select(Device)
        .where(Device.id.in_(device_ids))
        .options(
            selectinload(Device.agents), selectinload(Device.owner), selectinload(Device.cluster)
        )
    )
    devices = list(session.exec(statement).all())
    if len(devices) != len(set(device_ids)):
        raise HTTPException(status_code=404, detail="One or more devices were not found")
    return devices


def _get_agents(session: SessionDep, agent_ids: list[uuid.UUID]) -> list[Agent]:
    if not agent_ids:
        return []

    statement = (
        select(Agent)
        .where(Agent.id.in_(agent_ids))
        .options(selectinload(Agent.devices), selectinload(Agent.cluster))
    )
    agents = list(session.exec(statement).all())
    if len(agents) != len(set(agent_ids)):
        raise HTTPException(status_code=404, detail="One or more agents were not found")
    return agents


def _ensure_device_access(current_user: CurrentUser, devices: list[Device]) -> None:
    unauthorized = [
        device.name
        for device in devices
        if not can_manage_owned_resource(current_user, device.owner_id)
    ]
    if unauthorized:
        raise HTTPException(
            status_code=403,
            detail=f"Not authorized to manage devices: {', '.join(sorted(unauthorized))}.",
        )


def _prune_device_agents_for_cluster(
    devices: list[Device], cluster_agent_ids: set[uuid.UUID]
) -> None:
    for device in devices:
        device.agents = [agent for agent in device.agents if agent.id in cluster_agent_ids]


def _assign_cluster_membership(
    cluster: Cluster,
    devices: list[Device] | None,
    agents: list[Agent] | None,
) -> None:
    if devices is not None:
        selected_device_ids = {device.id for device in devices}
        for device in list(cluster.devices):
            if device.id not in selected_device_ids:
                device.cluster = None
        for device in devices:
            device.cluster = cluster

    if agents is not None:
        selected_agent_ids = {agent.id for agent in agents}
        for agent in list(cluster.agents):
            if agent.id not in selected_agent_ids:
                agent.cluster = None
        for agent in agents:
            agent.cluster = cluster

    cluster_agent_ids = {agent.id for agent in cluster.agents}
    _prune_device_agents_for_cluster(cluster.devices, cluster_agent_ids)


def _build_cluster_wake_message(
    cluster: Cluster, successful_device_count: int, failed_device_count: int
) -> str:
    return (
        f"Cluster '{cluster.name}' wake dispatched for {successful_device_count} device(s). "
        f"{failed_device_count} device(s) had no successful agent dispatch."
    )


@router.get("/", response_model=ClustersPublic)
async def list_clusters(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
):
    count_stmt = select(func.count()).select_from(Cluster)
    count = session.exec(count_stmt).one()
    statement = (
        select(Cluster)
        .options(
            selectinload(Cluster.owner),
            selectinload(Cluster.devices),
            selectinload(Cluster.agents),
        )
        .order_by(Cluster.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    clusters = list(session.exec(statement).all())
    return ClustersPublic(
        clusters=[serialize_cluster(cluster) for cluster in clusters],
        count=count,
    )


@router.get("/{cluster_id}", response_model=ClusterDetailPublic)
async def get_cluster(
    cluster_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    cluster = _get_cluster(session, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return serialize_cluster(cluster, include_relations=True)


@router.post("/", response_model=ClusterPublic, status_code=status.HTTP_201_CREATED)
async def create_cluster(
    cluster_in: ClusterCreate,
    current_user: CurrentUser,
    session: SessionDep,
):
    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot create clusters")

    devices = _get_devices(session, cluster_in.device_ids)
    agents = _get_agents(session, cluster_in.agent_ids)
    _ensure_device_access(current_user, devices)

    cluster_data = cluster_in.model_dump(exclude={"device_ids", "agent_ids"})
    cluster = Cluster.model_validate(
        {**cluster_data, "owner_id": current_user.id},
    )
    session.add(cluster)
    session.flush()
    _assign_cluster_membership(cluster, devices, agents)
    cluster.updated_at = _utc_now()
    session.commit()

    cluster = _get_cluster(session, cluster.id)
    assert cluster is not None
    return serialize_cluster(cluster)


@router.put("/{cluster_id}", response_model=ClusterPublic)
async def update_cluster(
    cluster_id: uuid.UUID,
    cluster_in: ClusterUpdate,
    current_user: CurrentUser,
    session: SessionDep,
):
    cluster = _get_cluster(session, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    if not can_manage_owned_resource(current_user, cluster.owner_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this cluster")

    cluster_data = cluster_in.model_dump(exclude_unset=True)
    devices = None
    agents = None
    if "device_ids" in cluster_data:
        devices = _get_devices(session, cluster_data.pop("device_ids") or [])
        _ensure_device_access(current_user, devices)
    if "agent_ids" in cluster_data:
        agents = _get_agents(session, cluster_data.pop("agent_ids") or [])

    cluster.sqlmodel_update(cluster_data)
    _assign_cluster_membership(cluster, devices, agents)
    cluster.updated_at = _utc_now()
    session.add(cluster)
    session.commit()

    cluster = _get_cluster(session, cluster.id)
    assert cluster is not None
    return serialize_cluster(cluster)


@router.delete("/{cluster_id}")
async def delete_cluster(
    cluster_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    cluster = _get_cluster(session, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    if not can_manage_owned_resource(current_user, cluster.owner_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this cluster")

    for device in list(cluster.devices):
        device.cluster = None
    for agent in list(cluster.agents):
        agent.cluster = None

    session.delete(cluster)
    session.commit()
    return Message(message="Cluster deleted successfully")


@router.post("/{cluster_id}/wake", status_code=status.HTTP_202_ACCEPTED)
async def wake_cluster(
    cluster_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    cluster = _get_cluster(session, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot wake clusters")
    if not can_manage_owned_resource(current_user, cluster.owner_id):
        raise HTTPException(status_code=403, detail="Not authorized to wake this cluster")
    if not cluster.devices:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cluster has no devices to wake.",
        )

    result = wake_service.dispatch_cluster_wake(cluster)
    if result.successful_device_count == 0:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to dispatch Wake-on-LAN packets for any device in this cluster.",
        )

    return Message(
        message=_build_cluster_wake_message(
            cluster,
            result.successful_device_count,
            result.failed_device_count,
        )
    )
