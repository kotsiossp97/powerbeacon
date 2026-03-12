# Build Agent binaries
FROM golang:1.26 AS builder

WORKDIR /app

COPY ./agent/go.mod ./
COPY ./agent/go.sum ./

RUN go mod download

COPY ./agent/ ./

RUN bash ./build.sh all

# Build FastAPI server
FROM python:3.12-slim

WORKDIR /app

# Copy agent binaries and install scripts
COPY --from=builder /app/build /app/agents/binaries
COPY --from=builder /app/install /app/agents/install

RUN apt-get update && apt-get install -y \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download the latest installer
ADD https://astral.sh/uv/install.sh /uv-installer.sh

# Run the installer then remove it
RUN sh /uv-installer.sh && rm /uv-installer.sh
# Ensure the installed binary is on the `PATH`
ENV PATH="/root/.local/bin/:$PATH"

# Omit development dependencies
ENV UV_NO_DEV=1

# Install dependencies and copy source code
RUN --mount=type=bind,source=./backend/uv.lock,target=uv.lock \
    --mount=type=bind,source=./backend/pyproject.toml,target=pyproject.toml \
    uv sync --locked

COPY ./backend/powerbeacon ./powerbeacon
COPY ./backend/main.py .

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

# Start server
CMD ["fastapi", "run", "main.py", "--host", "0.0.0.0", "--port", "8000"]
