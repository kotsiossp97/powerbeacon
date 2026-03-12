from fastapi import APIRouter, HTTPException, status
from powerbeacon.core.deps import SessionDep, CurrentUser
from powerbeacon.models.generic import Message
from powerbeacon.models.users import User
from powerbeacon.models.agents import Agent, AgentStatus
from powerbeacon.models.devices import (
    Device,
    DevicesPublic,
    DevicePublic,
    DeviceCreate,
    DeviceUpdate,
)
from sqlmodel import select, func, col
import uuid
from powerbeacon.services.agent_service import agent_service

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("/")
async def list_devices(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
):
    # All authenticated users (viewer, user, admin, superuser) can view all devices
    count_stmt = select(func.count()).select_from(Device)
    count = session.exec(count_stmt).one()
    statement = (
        select(
            Device,
            User.full_name.label("owner_name"),
            Agent.hostname.label("agent_hostname"),
        )
        .join(User, Device.owner_id == User.id, isouter=True)
        .join(Agent, Device.agent_id == Agent.id, isouter=True)
        .order_by(col(Device.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    devices = session.exec(statement).all()
    devices_public = [
        DevicePublic.model_validate(
            device, update={"owner_name": owner_name, "agent_hostname": agent_hostname}
        )
        for device, owner_name, agent_hostname in devices
    ]
    return DevicesPublic(devices=devices_public, count=count)


@router.get("/{device_id}", response_model=DevicePublic)
async def get_device(
    device_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Get a specific device. All authenticated users can view any device."""
    statement = (
        select(
            Device,
            User.full_name.label("owner_name"),
            Agent.hostname.label("agent_hostname"),
        )
        .join(User, Device.owner_id == User.id, isouter=True)
        .join(Agent, Device.agent_id == Agent.id, isouter=True)
        .where(Device.id == device_id)
    )
    result = session.exec(statement).first()
    if not result:
        raise HTTPException(status_code=404, detail="Device not found")
    device, owner_name, agent_hostname = result
    return DevicePublic.model_validate(
        device, update={"owner_name": owner_name, "agent_hostname": agent_hostname}
    )


@router.post("/", response_model=DevicePublic, status_code=status.HTTP_201_CREATED)
async def create_device(
    device_in: DeviceCreate,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Create a new device. Viewers cannot create devices."""
    if current_user.role == "viewer":
        raise HTTPException(status_code=403, detail="Viewers cannot create devices")

    device = Device.model_validate(device_in, update={"owner_id": current_user.id})
    session.add(device)
    session.commit()
    session.refresh(device)
    return device


@router.put("/{device_id}", response_model=DevicePublic)
async def update_device(
    device_id: uuid.UUID,
    device_in: DeviceUpdate,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Update a device. Only superuser or device owner can update."""
    device = session.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if current_user.role != "superuser" and device.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to update this device"
        )

    device_data = device_in.model_dump(exclude_unset=True)
    device.sqlmodel_update(device_data)
    session.add(device)
    session.commit()
    session.refresh(device)
    return device


@router.delete("/{device_id}")
async def delete_device(
    device_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Delete a device. Only superuser or device owner can delete."""
    device = session.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if current_user.role != "superuser" and device.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this device"
        )

    session.delete(device)
    session.commit()
    return Message(message="Device deleted successfully")


@router.post("/{device_id}/wake", status_code=status.HTTP_202_ACCEPTED)
async def wake_device(
    device_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    """Wake a device. Only superuser or device owner can perform actions."""
    device = session.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if current_user.role == "viewer":
        raise HTTPException(
            status_code=403, detail="Viewers cannot perform device actions"
        )
    if current_user.role != "superuser" and device.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to wake this device"
        )

    if not device.agent_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Device has no agent assigned. Assign an agent before sending a wake request.",
        )

    agent = session.get(Agent, device.agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned agent not found.",
        )
    if agent.status != AgentStatus.ONLINE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Assigned agent '{agent.hostname}' is currently offline.",
        )

    # Determine broadcast address from device IP (assuming /24) or fall back to subnet broadcast
    broadcast_address = "255.255.255.255"
    if device.ip_address:
        parts = device.ip_address.split(".")
        if len(parts) == 4:
            parts[3] = "255"
            broadcast_address = ".".join(parts)

    wake_success = agent_service.dispatch_wol(
        agent=agent,
        mac_address=device.mac_address,
        broadcast_address=broadcast_address,
    )
    if not wake_success:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to dispatch Wake-on-LAN packet. Agent communication error.",
        )

    return Message(message="Wake-on-LAN packet dispatched successfully")
