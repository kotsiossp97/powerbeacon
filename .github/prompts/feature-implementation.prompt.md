---
description: "Implement a scoped feature in PowerBeacon while preserving architecture boundaries, component conventions, and component-specific validation commands."
name: "PowerBeacon Feature Implementation"
argument-hint: "Describe component and feature scope, for example: backend add endpoint to filter devices by agent status"
agent: "agent"
---
Implement the requested feature using existing patterns in this repository.

Requirements:
- Identify the impacted component first: frontend, backend, agent, docs, or cross-component.
- Preserve architecture boundaries: frontend calls backend APIs, backend dispatches WOL via agent, agent executes LAN broadcast.
- Follow local conventions already used in nearby files.
- Keep changes minimal and localized.

Execution checklist:
1. Locate and summarize existing patterns to mirror before editing.
2. Implement the feature with production-ready code and clear typing.
3. Add or update tests when the component has test coverage in scope.
4. Run relevant validation commands only for changed components.
5. Provide a concise change summary including risks and follow-up items.

Component command reference:
- Frontend: npm run lint, npm run build
- Backend: uv run ruff check ., uv run format ., python main.py or uvicorn powerbeacon.main:app --reload
- Agent: make test, make local or make build
- Docs: uv run zensical build
- Root Docker: docker compose up -d or docker compose -f docker-compose.dev.yml up -d

Output format:
- Scope
- Files changed
- Validation run
- Architecture checks
- Risks and next steps
