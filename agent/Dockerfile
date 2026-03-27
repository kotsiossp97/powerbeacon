# ────────────────────────────────────────────────────────────────
# Stage 1: Build
# ────────────────────────────────────────────────────────────────
FROM golang:1.26 AS builder

# Build arguments for cross-compilation
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

COPY ./go.mod ./
COPY ./go.sum ./

RUN go mod download

# Copy the rest of the source
COPY . .

# Build static binary for target architecture using build script
RUN bash ./build.sh docker-cross

# ────────────────────────────────────────────────────────────────
# Stage 2: Runtime image
# ────────────────────────────────────────────────────────────────
FROM scratch

# Copy CA certificates from builder so the agent can make HTTPS
# calls to the backend if it is behind TLS.
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the binary
COPY --from=builder /app/build/powerbeacon-agent /powerbeacon-agent

# Document the port the agent listens on (informational only,
# has no effect when network_mode: host is used)
EXPOSE 18080

# Environment variable defaults — all overridable at runtime
ENV BACKEND_URL=http://localhost:8000
ENV AGENT_PORT=18080
ENV AGENT_BIND=0.0.0.0
ENV AGENT_ADVERTISE_IP=

ENTRYPOINT ["/powerbeacon-agent"]