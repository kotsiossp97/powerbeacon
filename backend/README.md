# PowerBeacon Backend

FastAPI backend for PowerBeacon.

## Responsibilities

- Authentication and authorization
- Device, cluster, and agent inventory APIs
- Wake-on-LAN orchestration through registered agents
- Agent registration and heartbeat lifecycle

## Data model highlights

- `clusters` group devices and agents
- `devices` belong to an owner and optionally a cluster
- `devices` and `agents` are linked through a many-to-many association
- Wake requests dispatch through every associated online agent

## Run locally

```bash
pip install -e .
python main.py
```

## Development note

The schema is currently changed directly in development. Reset local databases created with the older single-agent device model before running this version.
