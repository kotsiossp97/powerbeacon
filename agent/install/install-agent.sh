#!/bin/bash

# PowerBeacon Agent Installation Script for Linux
# This script downloads and installs the PowerBeacon agent as a systemd service

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
AGENT_ADVERTISE_IP="${AGENT_ADVERTISE_IP:-}"
INSTALL_DIR="/usr/local/bin"
SERVICE_FILE="/etc/systemd/system/powerbeacon-agent.service"
BINARY_NAME="powerbeacon-agent"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root${NC}"
    echo "Please run with sudo: sudo $0"
    exit 1
fi

echo -e "${GREEN}PowerBeacon Agent Installer${NC}"
echo "Backend URL: $BACKEND_URL"
if [ -n "$AGENT_ADVERTISE_IP" ]; then
    echo "Advertise IP: $AGENT_ADVERTISE_IP"
fi
echo ""

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        ARCH="amd64"
        ;;
    aarch64|arm64)
        ARCH="arm64"
        ;;
    *)
        echo -e "${RED}Unsupported architecture: $ARCH${NC}"
        exit 1
        ;;
esac

# Download binary
echo -e "${YELLOW}Downloading agent binary...${NC}"
DOWNLOAD_URL="$BACKEND_URL/agents/linux-$ARCH"
curl -fsSL "$DOWNLOAD_URL" -o "/tmp/$BINARY_NAME" || {
    echo -e "${RED}Failed to download agent binary${NC}"
    exit 1
}

# Make binary executable
chmod +x "/tmp/$BINARY_NAME"

# Move to install directory
echo -e "${YELLOW}Installing binary to $INSTALL_DIR...${NC}"
mv "/tmp/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"

# Create systemd service file
echo -e "${YELLOW}Creating systemd service...${NC}"
AGENT_ARGS="-backend=$BACKEND_URL"
if [ -n "$AGENT_ADVERTISE_IP" ]; then
    AGENT_ARGS="$AGENT_ARGS -advertise-ip=$AGENT_ADVERTISE_IP"
fi

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=PowerBeacon Agent
After=network.target

[Service]
Type=simple
User=root
ExecStart=$INSTALL_DIR/$BINARY_NAME $AGENT_ARGS
Restart=always
RestartSec=10
Environment="BACKEND_URL=$BACKEND_URL"
Environment="AGENT_ADVERTISE_IP=$AGENT_ADVERTISE_IP"

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start service
echo -e "${YELLOW}Enabling and starting service...${NC}"
systemctl enable powerbeacon-agent
systemctl start powerbeacon-agent

# Check status
sleep 2
if systemctl is-active --quiet powerbeacon-agent; then
    echo -e "${GREEN}✓ PowerBeacon Agent installed and running successfully!${NC}"
    echo ""
    echo "Service status: systemctl status powerbeacon-agent"
    echo "View logs: journalctl -u powerbeacon-agent -f"
    echo "Stop service: systemctl stop powerbeacon-agent"
    echo "Restart service: systemctl restart powerbeacon-agent"
else
    echo -e "${RED}✗ Service failed to start${NC}"
    echo "Check logs: journalctl -u powerbeacon-agent -n 50"
    exit 1
fi
