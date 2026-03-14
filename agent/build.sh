#!/bin/bash

# PowerBeacon Agent Build Script
# Usage: ./build.sh [target]
# Targets: all, linux, windows, darwin, local, clean

set -e

BINARY_NAME="powerbeacon-agent"
BUILD_DIR="build"
VERSION="1.0.0"

build_linux() {
    echo "Building for Linux (amd64)..."
    GOOS=linux GOARCH=amd64 go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME-linux-amd64" ./cmd/agent
}

build_linux_arm64() {
    echo "Building for Linux (arm64)..."
    GOOS=linux GOARCH=arm64 go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME-linux-arm64" ./cmd/agent
}

build_windows() {
    echo "Building for Windows (amd64)..."
    GOOS=windows GOARCH=amd64 go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME-windows-amd64.exe" ./cmd/agent
}

build_darwin() {
    echo "Building for macOS (amd64)..."
    GOOS=darwin GOARCH=amd64 go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME-darwin-amd64" ./cmd/agent
    
    echo "Building for macOS (arm64)..."
    GOOS=darwin GOARCH=arm64 go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME-darwin-arm64" ./cmd/agent
}

build_local() {
    echo "Building for local platform..."
    go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME" ./cmd/agent
}

clean_build() {
    echo "Cleaning build artifacts..."
    rm -rf "$BUILD_DIR"
}

ensure_build_dir() {
    mkdir -p "$BUILD_DIR"
}

copy_to_api_dir() {
    API_DIR="../backend/agents"
    mkdir -p "$API_DIR/binaries"
    API_BIN_DIR="$API_DIR/binaries"
    cp "$BUILD_DIR/$BINARY_NAME-linux-amd64" "$API_BIN_DIR/"
    cp "$BUILD_DIR/$BINARY_NAME-windows-amd64.exe" "$API_BIN_DIR/"
    cp "$BUILD_DIR/$BINARY_NAME-darwin-amd64" "$API_BIN_DIR/"
    cp "$BUILD_DIR/$BINARY_NAME-darwin-arm64" "$API_BIN_DIR/"
    # Copy install scripts
    cp install/* "$API_DIR/install/."
}

TARGET="${1:-all-api}"

case "$TARGET" in
    all-api)
        clean_build
        ensure_build_dir
        build_linux
        build_linux_arm64
        build_windows
        build_darwin
        copy_to_api_dir
        echo "Build complete and copied to API directory!"
    ;;
    all)
        clean_build
        ensure_build_dir
        build_linux
        build_linux_arm64
        build_windows
        build_darwin
        echo "Build complete!"
    ;;
    linux)
        ensure_build_dir
        build_linux
    ;;
    linux-arm64)
        ensure_build_dir
        build_linux_arm64
    ;;
    windows)
        ensure_build_dir
        build_windows
    ;;
    darwin)
        ensure_build_dir
        build_darwin
    ;;
    local)
        ensure_build_dir
        build_local
    ;;
    clean)
        clean_build
    ;;
    *)
        echo "Unknown target: $TARGET"
        echo "Available targets: all, linux, linux-arm64, windows, darwin, local, clean"
        exit 1
    ;;
esac
