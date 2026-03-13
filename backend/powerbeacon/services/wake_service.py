from __future__ import annotations

from dataclasses import dataclass, field

from powerbeacon.models.agents import AgentStatus
from powerbeacon.models.clusters import Cluster
from powerbeacon.models.devices import Device
from powerbeacon.services.agent_service import agent_service


@dataclass
class WakeDispatchResult:
    successful_agents: list[str] = field(default_factory=list)
    failed_agents: list[str] = field(default_factory=list)
    offline_agents: list[str] = field(default_factory=list)

    @property
    def attempted_count(self) -> int:
        return len(self.successful_agents) + len(self.failed_agents) + len(self.offline_agents)


@dataclass
class ClusterWakeResult:
    device_results: dict[str, WakeDispatchResult] = field(default_factory=dict)

    @property
    def successful_device_count(self) -> int:
        return sum(1 for result in self.device_results.values() if result.successful_agents)

    @property
    def failed_device_count(self) -> int:
        return sum(1 for result in self.device_results.values() if not result.successful_agents)


class WakeService:
    @staticmethod
    def get_broadcast_address(device: Device) -> str:
        if not device.ip_address:
            return "255.255.255.255"

        parts = device.ip_address.split(".")
        if len(parts) != 4:
            return "255.255.255.255"

        parts[3] = "255"
        return ".".join(parts)

    def dispatch_device_wake(self, device: Device) -> WakeDispatchResult:
        result = WakeDispatchResult()
        broadcast_address = self.get_broadcast_address(device)

        for agent in device.agents:
            if agent.status != AgentStatus.ONLINE:
                result.offline_agents.append(agent.hostname)
                continue

            wake_success = agent_service.dispatch_wol(
                agent=agent,
                mac_address=device.mac_address,
                broadcast_address=broadcast_address,
            )
            if wake_success:
                result.successful_agents.append(agent.hostname)
            else:
                result.failed_agents.append(agent.hostname)

        return result

    def dispatch_cluster_wake(self, cluster: Cluster) -> ClusterWakeResult:
        return ClusterWakeResult(
            device_results={
                str(device.id): self.dispatch_device_wake(device) for device in cluster.devices
            }
        )


wake_service = WakeService()
