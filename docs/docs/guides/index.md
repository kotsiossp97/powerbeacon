---
icon: lucide/book-open
tags:
  - Guides
---

# Guides

This section provides task-driven walkthroughs for common PowerBeacon operations.

## Guide Path

```mermaid
flowchart TD
    A[Pick task] --> B{Task type}
    B -->|Setup| C[Setup guides]
    B -->|Operations| D[Operations guides]
    B -->|Troubleshooting| E[Diagnostics playbooks]
    C --> F[Execute commands]
    D --> F
    E --> F
    F --> G[Validate outcome]
    style A fill:#2563eb,stroke:#1e3a8a,color:#fff
    style G fill:#16a34a,stroke:#166534,color:#fff
```

## Recommended Guide Topics

- First successful wake from the dashboard
- Registering and validating a new agent
- Assigning devices to the correct agent
- Role and permission setup for teams
- Diagnosing failed wake attempts

!!! info "Authoring style"
    Prefer guide pages with: Objective, Prerequisites, Steps, Verification, and Troubleshooting.

## Guide Template

=== "Structure"

    1. Objective
    2. Prerequisites
    3. Steps
    4. Verification
    5. Recovery and rollback

=== "Quality checklist"

    - Commands are copy/paste-safe
    - Every major step has a verification check
    - Common failure paths are documented
    - Links to related sections are included
