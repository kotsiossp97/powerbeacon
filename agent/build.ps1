# PowerBeacon Agent Build Script for Windows
# Usage: .\build.ps1 [target]
# Targets: all, linux, windows, darwin, local, clean

param(
    [string]$Target = "all-api"
)

$BINARY_NAME = "powerbeacon-agent"
$BUILD_DIR = "build"
$VERSION = "1.0.0"

function Build-Linux {
    Write-Host "Building for Linux (amd64)..." -ForegroundColor Green
    $env:GOOS = "linux"
    $env:GOARCH = "amd64"
    go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME-linux-amd64" ./cmd/agent
    Remove-Item Env:\GOOS
    Remove-Item Env:\GOARCH
}

function Build-Windows {
    Write-Host "Building for Windows (amd64)..." -ForegroundColor Green
    $env:GOOS = "windows"
    $env:GOARCH = "amd64"
    go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME-windows-amd64.exe" ./cmd/agent
    Remove-Item Env:\GOOS
    Remove-Item Env:\GOARCH
}

function Build-Darwin {
    Write-Host "Building for macOS (amd64)..." -ForegroundColor Green
    $env:GOOS = "darwin"
    $env:GOARCH = "amd64"
    go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME-darwin-amd64" ./cmd/agent
    
    Write-Host "Building for macOS (arm64)..." -ForegroundColor Green
    $env:GOARCH = "arm64"
    go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME-darwin-arm64" ./cmd/agent
    
    Remove-Item Env:\GOOS
    Remove-Item Env:\GOARCH
}

function Build-Local {
    Write-Host "Building for local platform..." -ForegroundColor Green
    go build -ldflags "-s -w -X main.Version=$VERSION" -o "$BUILD_DIR/$BINARY_NAME.exe" ./cmd/agent
}

function Clean-Build {
    Write-Host "Cleaning build artifacts..." -ForegroundColor Yellow
    if (Test-Path $BUILD_DIR) {
        Remove-Item -Recurse -Force $BUILD_DIR
    }
}

function Ensure-BuildDir {
    if (-not (Test-Path $BUILD_DIR)) {
        New-Item -ItemType Directory -Path $BUILD_DIR | Out-Null
    }
}

# Main execution
switch ($Target.ToLower()) {
    "all-api" {
        Clean-Build
        Ensure-BuildDir
        Build-Linux
        Build-Windows
        Build-Darwin
        # Copy binaries to API directory (adjust path as needed)
        $apiDir = "../backend/agents"
        if (-not (Test-Path $apiDir)) {
            New-Item -ItemType Directory -Path $apiDir | Out-Null
        }
        Get-ChildItem "$BUILD_DIR/*" | ForEach-Object {
            Copy-Item $_.FullName -Destination "$apiDir/binaries/$($_.Name)" -Force
        }

        # Copy install scripts to API directory
        Get-ChildItem "./install/*" | ForEach-Object {
            Copy-Item $_.FullName -Destination "$apiDir/install/$($_.Name)" -Force
        }
        Write-Host "Build complete and copied to API directory!" -ForegroundColor Cyan
    }
    "all" {
        Clean-Build
        Ensure-BuildDir
        Build-Linux
        Build-Windows
        Build-Darwin
        Write-Host "Build complete!" -ForegroundColor Cyan
    }
    "linux" {
        Ensure-BuildDir
        Build-Linux
    }
    "windows" {
        Ensure-BuildDir
        Build-Windows
    }
    "darwin" {
        Ensure-BuildDir
        Build-Darwin
    }
    "local" {
        Ensure-BuildDir
        Build-Local
    }
    "clean" {
        Clean-Build
    }
    default {
        Write-Host "Unknown target: $Target" -ForegroundColor Red
        Write-Host "Available targets: all, linux, windows, darwin, local, clean"
        exit 1
    }
}
