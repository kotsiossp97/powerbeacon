---
description: "Use when editing Go agent startup/runtime code, WOL handlers, networking logic, backend registration, or heartbeat behavior. Protects token-auth /wol semantics, lifecycle guarantees, and host-LAN assumptions."
name: "Agent Runtime And Network Guarantees"
applyTo:
  - "agent/cmd/**"
  - "agent/internal/**"
---

# Agent Runtime And Network Guarantees

## Security And API Behavior

- Keep bearer-token protection for the /wol endpoint intact.
- Validate input payloads for MAC, broadcast address, and port using existing handler conventions.
- Do not relax authentication checks on agent HTTP handlers.

## Lifecycle Guarantees

- Preserve startup sequence behavior: detect network context, register to backend, expose API, maintain heartbeat.
- Preserve retry and recovery behavior when backend connectivity is unavailable.
- Keep graceful shutdown handling and heartbeat cancellation semantics stable.

## Network Assumptions

- Maintain host-LAN execution assumptions for Wake-on-LAN packet delivery.
- Do not redesign agent networking in ways that depend on Docker Desktop container broadcast behavior.
- Keep broadcast detection and manual override behavior compatible with AGENT_ADVERTISE_IP usage.

## Code Organization

- Keep command bootstrap concerns in agent/cmd and operational logic in agent/internal packages.
- Prefer existing modules for WOL packet creation, network broadcast selection, and backend client communication.
- Keep changes focused and avoid broad refactors that alter registration or heartbeat contracts without tests.
