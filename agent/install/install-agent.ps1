# PowerBeacon Agent Installation Script for Windows
# This script downloads and installs the PowerBeacon agent as a Windows service

param(
    [string]$BackendURL = $env:BACKEND_URL,
    [string]$AdvertiseIP = $env:AGENT_ADVERTISE_IP,
    [string]$AgentPort = $env:AGENT_PORT
)

$ErrorActionPreference = "Stop"

# Configuration
if ([string]::IsNullOrEmpty($BackendURL)) {
    $BackendURL = "http://localhost:8000"
}

$InstallDir = "$env:ProgramFiles\PowerBeacon"
$BinaryName = "powerbeacon-agent.exe"
$ServiceName = "PowerBeaconAgent"

Write-Host "PowerBeacon Agent Installer" -ForegroundColor Green
Write-Host "Backend URL: $BackendURL"
if (-not [string]::IsNullOrEmpty($AdvertiseIP)) {
    Write-Host "Advertise IP: $AdvertiseIP"
}
if (-not [string]::IsNullOrEmpty($AgentPort)) {
    Write-Host "Agent Port: $AgentPort"
}
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Error: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'"
    exit 1
}

# Create installation directory
Write-Host "Creating installation directory..." -ForegroundColor Yellow
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

# Stop and remove existing service or task if present (BEFORE downloading)
$taskName = "PowerBeacon Agent"
$BinaryPath = Join-Path $InstallDir $BinaryName

# Check for existing Windows service
if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    Write-Host "Stopping existing service..." -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    
    Write-Host "Removing existing service..." -ForegroundColor Yellow
    sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 2
}

# Check for existing scheduled task
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Stopping existing scheduled task..." -ForegroundColor Yellow
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    
    Write-Host "Removing existing scheduled task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Kill any remaining agent processes
Write-Host "Ensuring no agent processes are running..." -ForegroundColor Yellow
$agentProcesses = Get-Process -Name "powerbeacon-agent" -ErrorAction SilentlyContinue
if ($agentProcesses) {
    Write-Host "Stopping $($agentProcesses.Count) agent process(es)..." -ForegroundColor Yellow
    $agentProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Download binary
Write-Host "Downloading agent binary..." -ForegroundColor Yellow
$DownloadURL = "$BackendURL/agents/windows-amd64.exe"

try {
    Invoke-WebRequest -Uri $DownloadURL -OutFile $BinaryPath -UseBasicParsing
    Write-Host "✓ Binary downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download agent binary" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Create Windows service using NSSM (if available) or Task Scheduler
Write-Host "Setting up PowerBeacon Agent..." -ForegroundColor Yellow
$AgentArguments = "-backend $BackendURL"
if (-not [string]::IsNullOrEmpty($AdvertiseIP)) {
    $AgentArguments += " -advertise-ip $AdvertiseIP"
}
if (-not [string]::IsNullOrEmpty($AgentPort)) {
    $AgentArguments += " -port $AgentPort"
}
# Check if NSSM is available
$nssmPath = Get-Command nssm -ErrorAction SilentlyContinue

if ($nssmPath) {
    Write-Host "Using NSSM to create Windows service..." -ForegroundColor Yellow
    
    # Use NSSM for better service management
    $nssmResult = nssm install $ServiceName $BinaryPath 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to create service with NSSM" -ForegroundColor Red
        Write-Host $nssmResult
        exit 1
    }
    
    nssm set $ServiceName AppParameters $AgentArguments
    nssm set $ServiceName DisplayName "PowerBeacon Agent"
    nssm set $ServiceName Description "PowerBeacon Wake-on-LAN Agent"
    nssm set $ServiceName Start SERVICE_AUTO_START
    
    # Start service
    Write-Host "Starting service..." -ForegroundColor Yellow
    Start-Service -Name $ServiceName
    
    # Check status
    Start-Sleep -Seconds 2
    $service = Get-Service -Name $ServiceName
    
    if ($service.Status -eq "Running") {
        Write-Host "✓ PowerBeacon Agent installed and running as a service!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Service Name: $ServiceName"
        Write-Host "Install Path: $InstallDir"
        Write-Host ""
        Write-Host "Management Commands:"
        Write-Host "  View status:    Get-Service $ServiceName"
        Write-Host "  Stop service:   Stop-Service $ServiceName"
        Write-Host "  Start service:  Start-Service $ServiceName"
        Write-Host "  Restart:        Restart-Service $ServiceName"
    } else {
        Write-Host "✗ Service failed to start" -ForegroundColor Red
        Write-Host "Status: $($service.Status)"
        exit 1
    }
} else {
    Write-Host "NSSM not found. Setting up as a startup task..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Note: NSSM is recommended for running as a Windows service." -ForegroundColor Cyan
    Write-Host "To install NSSM: choco install nssm (requires Chocolatey)" -ForegroundColor Cyan
    Write-Host ""
    
    # Create a startup task using Task Scheduler
    $taskName = "PowerBeacon Agent"
    $taskExists = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    
    if ($taskExists) {
        Write-Host "Removing existing scheduled task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }
    
    # Create task action
    $action = New-ScheduledTaskAction -Execute $BinaryPath -Argument $AgentArguments
    
    # Create task trigger (at system startup)
    $trigger = New-ScheduledTaskTrigger -AtStartup
    
    # Create task settings
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    
    # Create task principal (run as SYSTEM)
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    
    # Register the scheduled task
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "PowerBeacon Wake-on-LAN Agent" | Out-Null
    
    # Start the task
    Start-ScheduledTask -TaskName $taskName
    Start-Sleep -Seconds 2
    
    # Check if task is running
    $task = Get-ScheduledTask -TaskName $taskName
    if ($task.State -eq "Running") {
        Write-Host "✓ PowerBeacon Agent installed and running as a scheduled task!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Task Name: $taskName"
        Write-Host "Install Path: $InstallDir"
        Write-Host ""
        Write-Host "Management Commands:"
        Write-Host "  View status:    Get-ScheduledTask '$taskName'"
        Write-Host "  Stop agent:     Stop-ScheduledTask '$taskName'"
        Write-Host "  Start agent:    Start-ScheduledTask '$taskName'"
        Write-Host "  Remove task:    Unregister-ScheduledTask '$taskName' -Confirm:`$false"
    } else {
        Write-Host "✓ PowerBeacon Agent installed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "The agent will start automatically on next system boot."
        Write-Host "To start it now, run: Start-ScheduledTask '$taskName'"
    }
}

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "The agent will automatically register with the backend at:" -ForegroundColor Cyan
Write-Host "  $BackendURL" -ForegroundColor Cyan
if (-not [string]::IsNullOrEmpty($AdvertiseIP)) {
    Write-Host "It will advertise this IP to the backend:" -ForegroundColor Cyan
    Write-Host "  $AdvertiseIP" -ForegroundColor Cyan
}
