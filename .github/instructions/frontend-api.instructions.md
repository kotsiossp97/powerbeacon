---
description: "Use when editing frontend API modules, route loaders/actions, authentication flows, or request/response handling in React routes. Enforces centralized API client usage, auth handling, and route data-loading conventions."
name: "Frontend API And Route Conventions"
applyTo:
  - "frontend/src/api/**"
  - "frontend/src/routes/**"
---
# Frontend API And Route Conventions

## API Client Usage
- Route all HTTP requests through frontend/src/api/client.ts so token injection and 401 handling stay consistent.
- Keep endpoint wrappers in frontend/src/api and expose typed helper functions per domain.
- Do not call fetch or axios directly from route components when an API helper exists.

## Auth Handling
- Preserve existing authorization behavior implemented by the shared API client interceptors.
- Do not duplicate token read/write logic inside route pages.
- Keep login and current-user flows aligned with backend expectations for OAuth2 form login and bearer-authenticated API calls.

## Route Data Loading
- Keep route-level data loading in predictable loader/action style patterns used in this codebase.
- Use API helper modules from frontend/src/api for route data dependencies.
- Return user-facing error states from routes instead of swallowing API failures.

## Structure And Style
- Prefer existing type definitions in frontend/src/types.ts and keep new API payload types colocated with current patterns.
- Keep changes minimal and localized; avoid broad route refactors unless required by the task.
- Use react-router package imports consistent with the existing frontend code.
