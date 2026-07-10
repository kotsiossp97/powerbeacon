from __future__ import annotations

import asyncio
import contextlib
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from powerbeacon.core.db import engine
from powerbeacon.models.agents import AgentStatus
from powerbeacon.models.devices import Device
from powerbeacon.models.service_config import ServiceConfig
from powerbeacon.services.agent_service import agent_service

logger = logging.getLogger(__name__)


class DeviceReachabilityService:
    def __init__(self, interval_seconds: int = 60):
        self.interval_seconds = interval_seconds
        self.enabled = True
        self.update_resolved_ip = True
        self.stop_event: asyncio.Event | None = None
        self.task: asyncio.Task | None = None

    def _apply_row_config(self, row: ServiceConfig) -> None:
        config_data = row.config_data or {}
        self.interval_seconds = config_data.get("interval_seconds", 60)
        self.enabled = config_data.get("enabled", True)
        self.update_resolved_ip = config_data.get("update_resolved_ip", True)
        print(f"""Device reachability config updated: 
            enabled={self.enabled}
            interval_seconds={self.interval_seconds} 
            update_resolved_ip={self.update_resolved_ip}""")

    def fetch_config(self, session: Session | None = None) -> None:
        if session is None:
            with Session(engine) as local_session:
                self.fetch_config(local_session)
            return

        statement = (
            select(ServiceConfig)
            .where(ServiceConfig.service_name == "device_reachability")
            .limit(1)
        )
        row = session.exec(statement).first()
        if row:
            self._apply_row_config(row)

    def poll_once(self) -> None:
        now = datetime.now(timezone.utc)
        print("Polling devices for status")
        with Session(engine) as session:
            statement = (
                select(Device)
                .options(selectinload(Device.agents))
                .order_by(Device.created_at.desc())
            )
            devices = list(session.exec(statement).all())

            for device in devices:
                device_online = False
                resolved_ip = device.ip_address

                for agent in sorted(device.agents, key=lambda item: item.hostname.lower()):
                    if agent.status != AgentStatus.ONLINE:
                        continue

                    probe_result = agent_service.probe_device(
                        agent=agent,
                        mac_address=device.mac_address,
                        ip_address=device.ip_address,
                    )

                    probe_ip = probe_result.get("resolved_ip")
                    if probe_ip and probe_ip != resolved_ip:
                        resolved_ip = probe_ip

                    if probe_result.get("online"):
                        print(f"Device {device.ip_address} (resolved {resolved_ip}) is online.")
                        device_online = True
                        break

                device.is_online = device_online
                device.last_reachability_check_at = now
                if device_online:
                    device.last_online_at = now
                if self.update_resolved_ip and (resolved_ip and resolved_ip != device.ip_address):
                    device.ip_address = resolved_ip
                device.updated_at = now
                session.add(device)

            session.commit()

    def clear_online_status(self, session: Session | None = None) -> None:
        now = datetime.now(timezone.utc)

        if session is None:
            with Session(engine) as local_session:
                self.clear_online_status(local_session)
            return

        statement = select(Device).where(Device.is_online.is_(True))
        devices = list(session.exec(statement).all())
        if not devices:
            return

        for device in devices:
            device.is_online = False
            device.last_reachability_check_at = now
            device.updated_at = now
            session.add(device)

        session.commit()

    async def _run(self) -> None:
        if self.stop_event is None:
            self.stop_event = asyncio.Event()

        event = self.stop_event
        while not event.is_set():
            try:
                await asyncio.to_thread(self.poll_once)
            except Exception:
                logger.exception("Device reachability polling failed")

            try:
                await asyncio.wait_for(event.wait(), timeout=self.interval_seconds)
            except TimeoutError:
                continue

    def start(self) -> None:
        if not self.enabled:
            return

        if self.task and not self.task.done():
            return

        self.stop_event = asyncio.Event()
        self.task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self.stop_event:
            self.stop_event.set()

        if self.task and not self.task.done():
            self.task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.task

        self.task = None

    async def reload_runtime_config(self, session: Session | None = None) -> None:
        self.fetch_config(session)
        if self.enabled:
            self.start()
            return

        await self.stop()
        self.clear_online_status(session)


device_reachability_service = DeviceReachabilityService()
