"""CRUD operations for Agent model."""
import secrets
import uuid
from datetime import datetime, timezone, timedelta

from sqlmodel import Session, select

from powerbeacon.models.agents import Agent, AgentRegistration, AgentStatus


def create_agent(*, session: Session, agent_create: AgentRegistration) -> tuple[Agent, str]:
    """
    Create a new agent and generate an authentication token.
    
    Returns:
        tuple: (Agent, token) - The created agent and its authentication token
    """
    # Generate a secure token for the agent
    token = secrets.token_urlsafe(32)
    
    db_obj = Agent(
        hostname=agent_create.hostname,
        ip=agent_create.ip,
        port=agent_create.port,
        os=agent_create.os,
        version=agent_create.version,
        token=token,
        status=AgentStatus.ONLINE,
        last_seen=datetime.now(timezone.utc),
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj, token


def get_agent_by_id(*, session: Session, agent_id: uuid.UUID) -> Agent | None:
    """Get agent by ID."""
    statement = select(Agent).where(Agent.id == agent_id)
    return session.exec(statement).first()


def get_agent_by_token(*, session: Session, token: str) -> Agent | None:
    """Get agent by authentication token."""
    statement = select(Agent).where(Agent.token == token)
    return session.exec(statement).first()


def get_agents(*, session: Session, skip: int = 0, limit: int = 100) -> list[Agent]:
    """Get all agents with pagination."""
    statement = select(Agent).offset(skip).limit(limit)
    return list(session.exec(statement).all())


def update_agent_heartbeat(*, session: Session, agent: Agent) -> Agent:
    """Update agent's last_seen timestamp and set status to online."""
    agent.last_seen = datetime.now(timezone.utc)
    agent.status = AgentStatus.ONLINE
    session.add(agent)
    session.commit()
    session.refresh(agent)
    return agent


def update_agent_status(*, session: Session, agent: Agent, status: AgentStatus) -> Agent:
    """Update agent's status."""
    agent.status = status
    session.add(agent)
    session.commit()
    session.refresh(agent)
    return agent


def delete_agent(*, session: Session, agent_id: uuid.UUID) -> bool:
    """Delete an agent by ID."""
    agent = get_agent_by_id(session=session, agent_id=agent_id)
    if not agent:
        return False
    session.delete(agent)
    session.commit()
    return True


def check_offline_agents(*, session: Session, timeout_minutes: int = 2) -> list[Agent]:
    """
    Check for agents that haven't sent a heartbeat in the specified timeout
    and mark them as offline.
    
    Args:
        session: Database session
        timeout_minutes: Minutes after which an agent is considered offline (default: 2)
        
    Returns:
        List of agents that were marked as offline
    """
    cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)
    statement = select(Agent).where(
        Agent.last_seen < cutoff_time,
        Agent.status == AgentStatus.ONLINE
    )
    offline_agents = list(session.exec(statement).all())
    
    for agent in offline_agents:
        agent.status = AgentStatus.OFFLINE
        session.add(agent)
    
    if offline_agents:
        session.commit()
    
    return offline_agents


def get_online_agents(*, session: Session) -> list[Agent]:
    """Get all online agents."""
    statement = select(Agent).where(Agent.status == AgentStatus.ONLINE)
    return list(session.exec(statement).all())


def get_agent_by_hostname(*, session: Session, hostname: str) -> Agent | None:
    """Get agent by hostname."""
    statement = select(Agent).where(Agent.hostname == hostname)
    return session.exec(statement).first()
