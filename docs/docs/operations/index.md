---
icon: lucide/shield-check
tags:
  - Operations
---

# Operations

Operations documentation covers deployment, observability, security posture, and maintenance workflows for production environments.

## Operational Pillars

| Pillar | Outcome | Example artifacts |
| --- | --- | --- |
| Deployment | Predictable releases | compose profiles, env templates |
| Observability | Fast incident detection | health checks, logs, metrics |
| Security | Reduced attack surface | secrets rotation, RBAC, CORS policies |
| Reliability | Stable runtime behavior | backups, restore drills, dependency updates |

## Production Topology (Reference)

```mermaid
graph LR
    U[Operators] --> F[Frontend]
    F --> B[Backend API]
    B --> DB[(PostgreSQL)]
    B --> A1[Agent: Site A]
    B --> A2[Agent: Site B]
    A1 --> D1[Device subnet A]
    A2 --> D2[Device subnet B]
    style B fill:#7c3aed,stroke:#5b21b6,color:#fff
    style DB fill:#db2777,stroke:#9d174d,color:#fff
    style A1 fill:#0284c7,stroke:#075985,color:#fff
    style A2 fill:#0284c7,stroke:#075985,color:#fff
```

## Runbook Baseline

=== "Daily"

    - Check service health endpoints
    - Review failed wake attempts
    - Confirm active agents and heartbeat freshness
    - Review cluster coverage for devices that require more than one relay path

=== "Weekly"

    - Rotate logs and verify retention
    - Review security events and admin changes
    - Validate backups and restore points

=== "Monthly"

    - Upgrade dependencies and base images
    - Rotate secrets where feasible
    - Rehearse incident response checklist

!!! warning "Docker Desktop limitation"
    Direct LAN wake broadcasts from containers on Windows/macOS are unreliable. Keep WOL execution on LAN-adjacent agents.
