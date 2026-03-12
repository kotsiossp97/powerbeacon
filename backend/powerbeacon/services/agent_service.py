"""Agent service for dispatching WOL commands to agents."""

import logging

import httpx

from powerbeacon.models.agents import Agent

logger = logging.getLogger(__name__)


class AgentService:
    """Service for communicating with PowerBeacon agents."""

    def __init__(self, timeout_sec: float = 5.0):
        self.timeout_sec = timeout_sec

    def get_agent_url(self, agent: Agent) -> str:
        """Build the base URL for an agent using its registered IP and port."""
        return f"http://{agent.ip}:{agent.port}"

    def dispatch_wol(
        self,
        agent: Agent,
        mac_address: str,
        broadcast_address: str = "192.168.1.255",
        port: int = 9,
    ) -> bool:
        """
        Dispatch a Wake-on-LAN command to a specific agent.

        Args:
            agent: The agent that will send the WOL packet
            mac_address: MAC address of target device
            broadcast_address: Broadcast address to use
            port: UDP port for WOL packet (default: 9)

        Returns:
            True if WOL command was successfully dispatched, False otherwise
        """
        try:
            payload = {
                "mac": mac_address,
                "broadcast": broadcast_address,
                "port": port,
            }

            agent_url = self.get_agent_url(agent)
            wol_endpoint = f"{agent_url}/wol"

            logger.info(
                "Dispatching WOL to agent %s (%s:%s): mac=%s broadcast=%s",
                agent.hostname,
                agent.ip,
                agent.port,
                mac_address,
                broadcast_address,
            )

            headers = {
                "Authorization": f"Bearer {agent.token}",
                "Content-Type": "application/json",
            }

            with httpx.Client(timeout=self.timeout_sec) as client:
                response = client.post(wol_endpoint, json=payload, headers=headers)
                response.raise_for_status()

            logger.info(
                "Successfully dispatched WOL command to agent %s for MAC %s",
                agent.hostname,
                mac_address,
            )
            return True

        except httpx.HTTPError as e:
            logger.error(
                "HTTP error dispatching WOL to agent %s: %s",
                agent.hostname,
                str(e),
                exc_info=True,
            )
            return False
        except Exception as e:
            logger.error(
                "Failed to dispatch WOL command: %s",
                str(e),
                exc_info=True,
            )
            return False

    def check_agent_health(self, agent: Agent) -> dict:
        """Check health of a specific agent."""
        try:
            health_endpoint = f"{self.get_agent_url(agent)}/health"

            with httpx.Client(timeout=self.timeout_sec) as client:
                response = client.get(health_endpoint)
                response.raise_for_status()
                return response.json()

        except httpx.HTTPError as e:
            logger.error("HTTP error checking agent health: %s", str(e))
            return {"status": "error", "message": str(e)}
        except Exception as e:
            logger.error("Failed to check agent health: %s", str(e))
            return {"status": "error", "message": str(e)}


# Global agent service instance
agent_service = AgentService()
