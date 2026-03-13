"""Agent management API routes."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException, status
from powerbeacon.core.deps import CurrentUser, SessionDep
from powerbeacon.crud import agent_crud
from powerbeacon.models.agents import (
    Agent,
    AgentHeartbeat,
    AgentPublic,
    AgentRegistration,
    AgentRegistrationResponse,
    AgentsPublic,
    AgentStatus,
)
from powerbeacon.models.generic import Message
from powerbeacon.services.inventory_service import serialize_agent
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

router = APIRouter(prefix="/agents", tags=["Agents"])


def _get_agent_with_relationships(session: SessionDep, agent_id: uuid.UUID) -> Agent | None:
    statement = (
        select(Agent)
        .where(Agent.id == agent_id)
        .options(selectinload(Agent.cluster), selectinload(Agent.devices))
    )
    return session.exec(statement).first()


@router.post(
    "/register",
    response_model=AgentRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_agent(
    agent_in: AgentRegistration,
    session: SessionDep,
):
    """
    Register a new agent.

    This endpoint is called by agents when they start up to register with the backend.
    Returns an agent ID and authentication token.
    """
    # Check if agent with same hostname already exists
    existing_agent = agent_crud.get_agent_by_hostname(session=session, hostname=agent_in.hostname)

    if existing_agent:
        # Update existing agent instead of creating new one
        existing_agent.ip = agent_in.ip
        existing_agent.port = agent_in.port
        existing_agent.os = agent_in.os
        existing_agent.version = agent_in.version
        existing_agent.status = AgentStatus.ONLINE
        existing_agent.last_seen = datetime.now(timezone.utc)
        session.add(existing_agent)
        session.commit()
        session.refresh(existing_agent)

        return AgentRegistrationResponse(
            agent_id=str(existing_agent.id),
            token=existing_agent.token,
        )

    # Create new agent
    agent, token = agent_crud.create_agent(session=session, agent_create=agent_in)

    return AgentRegistrationResponse(
        agent_id=str(agent.id),
        token=token,
    )


@router.post("/heartbeat", status_code=status.HTTP_204_NO_CONTENT)
async def agent_heartbeat(
    heartbeat: AgentHeartbeat,
    session: SessionDep,
    authorization: str = Header(None),
):
    """
    Receive heartbeat from an agent.

    Agents should send heartbeats every 30 seconds to indicate they are still online.
    """
    # Verify agent token
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authorization header",
        )

    token = authorization[7:]  # Remove "Bearer " prefix

    try:
        agent_id = uuid.UUID(heartbeat.agent_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid agent ID format",
        )

    agent = agent_crud.get_agent_by_id(session=session, agent_id=agent_id)

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Verify token matches
    if agent.token != token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid agent token",
        )

    # Update heartbeat
    agent_crud.update_agent_heartbeat(session=session, agent=agent)

    return None


@router.get("/", response_model=AgentsPublic)
async def list_agents(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
):
    """
    List all registered agents.

    Requires any authenticated user except viewers.
    """
    if current_user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    # Check for offline agents
    agent_crud.check_offline_agents(session=session)

    count_stmt = select(func.count()).select_from(Agent)
    count = session.exec(count_stmt).one()

    statement = (
        select(Agent)
        .options(selectinload(Agent.cluster), selectinload(Agent.devices))
        .offset(skip)
        .limit(limit)
    )
    agents = list(session.exec(statement).all())

    return AgentsPublic(agents=[serialize_agent(agent) for agent in agents], count=count)


@router.get("/{agent_id}", response_model=AgentPublic)
async def get_agent(
    agent_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Get details of a specific agent.

    Requires any authenticated user except viewers.
    """
    if current_user.role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    agent = _get_agent_with_relationships(session, agent_id)

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    return serialize_agent(agent)


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
):
    """
    Delete an agent.

    Requires admin or superuser role.
    This only removes the agent from the database, it does not uninstall it from the host.
    """
    if current_user.role not in ["admin", "superuser"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    success = agent_crud.delete_agent(session=session, agent_id=agent_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    return Message(message="Agent deleted successfully")
