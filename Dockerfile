# Build Agent binaries
FROM golang:1.26 AS agent-builder

WORKDIR /app

COPY ./agent/go.mod ./
COPY ./agent/go.sum ./

RUN go mod download

COPY ./agent/ ./

RUN bash ./build.sh all


FROM node:lts AS frontend-builder

WORKDIR /app

COPY ./frontend/package*.json ./
RUN npm ci

COPY ./frontend/ ./
RUN npm run build


FROM nginx:alpine AS final

WORKDIR /app

# Copy agent binaries and install scripts
COPY --from=agent-builder /app/build /app/agents/binaries
COPY --from=agent-builder /app/install /app/agents/install

COPY --from=frontend-builder /app/dist /usr/share/nginx/html

RUN apk add --no-cache \
  curl \
  git \
  ca-certificates \
  bash \
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

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

COPY ./entrypoint.sh .

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["bash", "./entrypoint.sh"]