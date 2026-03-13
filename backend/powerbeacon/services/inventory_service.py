from __future__ import annotations

import uuid

from powerbeacon.models.agents import Agent, AgentPublic
from powerbeacon.models.clusters import Cluster, ClusterDetailPublic, ClusterPublic
from powerbeacon.models.devices import Device, DeviceAgentPublic, DevicePublic
from powerbeacon.models.users import User


def can_manage_owned_resource(user: User, owner_id: uuid.UUID | None) -> bool:
    return user.role in {"superuser", "admin"} or owner_id == user.id


def serialize_agent(agent: Agent) -> AgentPublic:
    return AgentPublic.model_validate(
        agent,
        update={
            "cluster_name": agent.cluster.name if agent.cluster else None,
            "device_count": len(agent.devices),
        },
    )


def serialize_device(device: Device) -> DevicePublic:
    sorted_agents = sorted(device.agents, key=lambda agent: agent.hostname.lower())
    return DevicePublic.model_validate(
        device,
        update={
            "owner_name": device.owner.full_name if device.owner else None,
            "cluster_name": device.cluster.name if device.cluster else None,
            "agents": [
                DeviceAgentPublic(
                    id=agent.id,
                    hostname=agent.hostname,
                    ip=agent.ip,
                    status=agent.status.value,
                )
                for agent in sorted_agents
            ],
        },
    )


def serialize_cluster(
    cluster: Cluster, include_relations: bool = False
) -> ClusterPublic | ClusterDetailPublic:
    base_update = {
        "owner_name": cluster.owner.full_name if cluster.owner else None,
        "device_count": len(cluster.devices),
        "agent_count": len(cluster.agents),
    }
    if not include_relations:
        return ClusterPublic.model_validate(cluster, update=base_update)

    return ClusterDetailPublic.model_validate(
        cluster,
        update={
            **base_update,
            "devices": [
                serialize_device(device)
                for device in sorted(cluster.devices, key=lambda item: item.name.lower())
            ],
            "agents": [
                serialize_agent(agent)
                for agent in sorted(cluster.agents, key=lambda item: item.hostname.lower())
            ],
        },
    )
