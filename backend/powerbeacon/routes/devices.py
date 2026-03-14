import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from powerbeacon.core.deps import CurrentUser, SessionDep
from powerbeacon.models.agents import Agent
from powerbeacon.models.clusters import Cluster
from powerbeacon.models.devices import (
    Device,
    DeviceCreate,
    DevicePublic,
    DevicesPublic,
    DeviceUpdate,
)
from powerbeacon.models.generic import Message
from powerbeacon.services.inventory_service import can_manage_owned_resource, serialize_device
from powerbeacon.services.wake_service import wake_service
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

router = APIRouter(prefix="/devices", tags=["Devices"])


def _get_device(session: SessionDep, device_id: uuid.UUID) -> Device | None:
    statement = (
        select(Device)
        .where(Device.id == device_id)
        .options(
            selectinload(Device.owner),
            selectinload(Device.cluster),
            selectinload(Device.agents),
        )
    )
    return session.exec(statement).first()


def _get_cluster(session: SessionDep, cluster_id: uuid.UUID | None) -> Cluster | None:
    if not cluster_id:
        return None

    cluster = session.get(Cluster, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return cluster


def _get_agents(session: SessionDep, agent_ids: list[uuid.UUID]) -> list[Agent]:
    if not agent_ids:
        return []

    statement = select(Agent).where(Agent.id.in_(agent_ids))
    agents = list(session.exec(statement).all())
    if len(agents) != len(set(agent_ids)):
        raise HTTPException(status_code=404, detail="One or more agents were not found")
    return agents


def _validate_agent_cluster_alignment(cluster_id: uuid.UUID | None, agents: list[Agent]) -> None:
    invalid_agents = [agent.hostname for agent in agents if agent.cluster_id != cluster_id]
    if invalid_agents:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Selected agents must belong to the same cluster as the device. "
                f"Invalid agents: {', '.join(sorted(invalid_agents))}."
            ),
        )


def _build_wake_message(
    device: Device, successful: list[str], failed: list[str], offline: list[str]
) -> str:
    parts = [
        f"Wake request for '{device.name}' dispatched through {len(successful)} agent(s).",
    ]
    if failed:
        parts.append(f"Failed: {', '.join(sorted(failed))}.")
    if offline:
        parts.append(f"Offline: {', '.join(sorted(offline))}.")
    return " ".join(parts)


@router.get("")
@router.get("/")
async def list_devices(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
):
    count_stmt = select(func.count()).select_from(Device)
    count = session.exec(count_stmt).one()
    statement = (
        select(Device)
        .options(
            selectinload(Device.owner),
            selectinload(Device.cluster),
            selectinload(Device.agents),
        )
        .order_by(Device.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    devices = list(session.exec(statement).all())
    return DevicesPublic(devices=[serialize_device(device) for device in devices], count=count)


@router.get("/{device_id}", response_model=DevicePublic)
async def get_device(
    device_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    device = _get_device(session, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return serialize_device(device)


@router.post("", response_model=DevicePublic, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=DevicePublic, status_code=status.HTTP_201_CREATED)
async def create_device(
    device_in: DeviceCreate,
    current_user: CurrentUser,
    session: SessionDep,
):
    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot create devices")

    cluster = _get_cluster(session, device_in.cluster_id)
    if cluster and not can_manage_owned_resource(current_user, cluster.owner_id):
        raise HTTPException(status_code=403, detail="Not authorized to use this cluster")

    agents = _get_agents(session, device_in.agent_ids)
    _validate_agent_cluster_alignment(device_in.cluster_id, agents)

    device_data = device_in.model_dump(exclude={"agent_ids"})
    device = Device.model_validate(
        {**device_data, "owner_id": current_user.id},
    )
    session.add(device)
    device.agents = agents
    session.commit()
    device = _get_device(session, device.id)
    assert device is not None
    return serialize_device(device)


@router.put("/{device_id}", response_model=DevicePublic)
async def update_device(
    device_id: uuid.UUID,
    device_in: DeviceUpdate,
    current_user: CurrentUser,
    session: SessionDep,
):
    device = _get_device(session, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if not can_manage_owned_resource(current_user, device.owner_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this device")

    device_data = device_in.model_dump(exclude_unset=True)
    next_cluster_id = device_data.get("cluster_id", device.cluster_id)
    cluster = _get_cluster(session, next_cluster_id)
    if cluster and not can_manage_owned_resource(current_user, cluster.owner_id):
        raise HTTPException(status_code=403, detail="Not authorized to use this cluster")

    agent_ids = device_data.pop("agent_ids", [agent.id for agent in device.agents])
    agents = _get_agents(session, agent_ids)
    _validate_agent_cluster_alignment(next_cluster_id, agents)

    device.sqlmodel_update(device_data)
    device.updated_at = datetime.now(timezone.utc)
    device.agents = agents
    session.add(device)
    session.commit()
    device = _get_device(session, device.id)
    assert device is not None
    return serialize_device(device)


@router.delete("/{device_id}")
async def delete_device(
    device_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    device = _get_device(session, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if not can_manage_owned_resource(current_user, device.owner_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this device")

    device.agents = []
    session.delete(device)
    session.commit()
    return Message(message="Device deleted successfully")


@router.post("/{device_id}/wake", status_code=status.HTTP_202_ACCEPTED)
async def wake_device(
    device_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    device = _get_device(session, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot perform device actions")
    if not can_manage_owned_resource(current_user, device.owner_id):
        raise HTTPException(status_code=403, detail="Not authorized to wake this device")

    if not device.agents:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Device has no associated agents. Associate at least one agent before sending a wake request.",
        )

    result = wake_service.dispatch_device_wake(device)
    if not result.successful_agents:
        offline_suffix = ""
        if result.offline_agents:
            offline_suffix = f" Offline agents: {', '.join(sorted(result.offline_agents))}."
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Failed to dispatch Wake-on-LAN packet through any associated agent."
                f"{offline_suffix}"
            ),
        )

    return Message(
        message=_build_wake_message(
            device,
            result.successful_agents,
            result.failed_agents,
            result.offline_agents,
        )
    )
