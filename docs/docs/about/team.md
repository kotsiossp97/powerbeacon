---
icon: lucide/users
tags:
  - About
---

# Development Team

<img src="https://avatars.githubusercontent.com/u/72583894" alt="Konstantinos Andreou" width="150" height="150" style="border-radius: 50%; margin-bottom: 20px; margin-inline: auto; display: block;">

PowerBeacon is developed as a personal project by Konstantinos Andreou, a software engineer with a passion for automation and efficient system management. With a background in software development and a keen interest in network technologies, Konstantinos created PowerBeacon to simplify the process of managing and orchestrating Wake-On-LAN (WOL) devices.

!!! info "Project philosophy"
    Build practical infrastructure software that is straightforward to operate, secure by default, and pleasant to maintain.

## Focus Areas

- Systems automation for everyday operations
- Secure remote device control workflows
- Clear, maintainable architecture boundaries
- Developer-friendly documentation and tooling

## Current Scope

  ```mermaid
  architecture-beta
    group backend(logos:python)[Backend Layer]
    group frontend(logos:react)[Frontend Layer]
    group agent(icons:server-cog)[Agent Layer]

    service fastApi(logos:fastapi-icon)[FastAPI Service] in backend
    service auth(icons:key-round)[Authentication] in backend
    service api(icons:server)[Device & Agent APIs] in backend

    service dashboard(logos:react)[React Dashboard] in frontend
    service ux(icons:user-key)[Role-based UX] in frontend
    service workflows(icons:workflow)[Operational Workflows] in frontend

    service deployment(icons:network)[LAN-adjacent Deployment] in agent
    service wol(icons:wand-sparkles)[Wake-on-LAN Delivery] in agent
    service heartbeat(icons:square-power)[Heartbeat Monitoring] in agent

    %% Connections showing data and control flow
    dashboard:R --> L:fastApi
    fastApi:R --> L:api
    api:B --> T:deployment
    deployment:R --> L:heartbeat
    wol:T --> B:deployment
  ```

---

## Contact
:fontawesome-brands-github: [kotsiossp97](https://github.com/kotsiossp97)
:lucide-globe: [kotsiossp97.github.io](https://kotsiossp97.github.io/)
:fontawesome-brands-linkedin: [Konstantinos Andreou](https://www.linkedin.com/in/konstantinos-andreou97/)

!!! tip "Contributions"
    Bug reports, feedback, and pull requests are welcome.
