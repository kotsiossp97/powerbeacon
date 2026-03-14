type AgentOsOptions = "linux" | "windows";

const getBackendUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || window.location.origin;
};

const getInstallCommand = (platform: AgentOsOptions) => {
  const backendUrl = getBackendUrl();
  if (platform === "linux") {
    return `curl -fsSL ${backendUrl}/install-agent.sh | sudo bash -s -- --backend ${backendUrl}`;
  } else {
    return `powershell -ExecutionPolicy Bypass -Command "& { $(irm ${backendUrl}/install-agent.ps1) } -BackendURL '${backendUrl}'"`;
  }
};

const getManualInstructions = (platform: AgentOsOptions) => {
  const backendUrl = getBackendUrl();
  if (platform === "linux") {
    return [
      "# Download the agent binary:",
      `wget ${backendUrl}/agents/linux-amd64 -O powerbeacon-agent`,
      "",
      "# Make it executable:",
      "chmod +x powerbeacon-agent",
      "",
      "# Run the agent:",
      `./powerbeacon-agent -backend ${backendUrl}`,
    ];
  } else {
    return [
      "# Download the agent binary:",
      `Invoke-WebRequest -Uri ${backendUrl}/agents/windows-amd64.exe -OutFile powerbeacon-agent.exe`,
      "",
      "# Run the agent:",
      `.\\powerbeacon-agent.exe -backend ${backendUrl}`,
    ];
  }
};

export { getInstallCommand, getManualInstructions };
