---
description: "Use when editing backend routes or services, adding API endpoints, modifying dependency injection, or implementing Wake-on-LAN flows. Enforces /api route structure, dependency patterns, and agent-only WOL dispatch."
name: "Backend Route And Service Boundaries"
applyTo:
  - "backend/powerbeacon/routes/**"
  - "backend/powerbeacon/services/**"
---
# Backend Route And Service Boundaries

## API Structure
- Keep backend endpoints under the existing /api router composition pattern.
- Follow router-per-domain organization in backend/powerbeacon/routes.
- Reuse existing response and error handling patterns in neighboring route modules.

## Dependencies And Security
- Use established dependency injection patterns for current user and database session access.
- Keep authentication and authorization behavior consistent with existing route guards.
- Preserve OAuth2 form login contract at /api/auth/login.

## Wake-On-LAN Dispatch Rule
- Do not send WOL packets directly from backend routes or services.
- Dispatch wake operations through the agent communication path only.
- Preserve agent registration, token, and heartbeat assumptions used by device wake flows.

## Service Layer Conventions
- Keep business logic in service modules and keep route handlers focused on request/response orchestration.
- Prefer existing CRUD and service abstractions before introducing new patterns.
- Keep endpoint changes minimal, explicit, and scoped to the domain being edited.
