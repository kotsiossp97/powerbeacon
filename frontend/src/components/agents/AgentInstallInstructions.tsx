/**
 * Agent installation instructions component
 */
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CodeBlock } from "../ui/code-block";
import { getInstallCommand, getManualInstructions } from "./instructions";

export const AgentInstallInstructions = () => {
  return (
    <div className="space-y-6">
      <p className="text-base ">
        The PowerBeacon agent runs on your local network and sends Wake-on-LAN
        packets to your devices. Install the agent on a machine that is always
        on and connected to the same network as your devices.
      </p>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Quick Install (Recommended)</h3>
        <CodeBlock
          tabs={[
            {
              code:
                "# Run this command in your terminal:\n" +
                getInstallCommand("linux"),
              language: "bash",
              label: "Linux/macOS",
            },
            {
              code:
                "# Run this command in PowerShell as Administrator:\n" +
                getInstallCommand("windows"),
              language: "powershell",
              label: "Windows",
            },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          This will download, install, and start the agent as a system service.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Manual Installation</h3>
        <p className="text-base">If you prefer to install manually:</p>
        <CodeBlock
          tabs={[
            {
              code: getManualInstructions("linux").join("\n"),
              language: "bash",
              label: "Linux/macOS",
            },
            {
              code: getManualInstructions("windows").join("\n"),
              language: "powershell",
              label: "Windows",
            },
          ]}
        />
      </div>

      <Alert>
        <AlertDescription>
          <h4 className="font-semibold mb-2">📝 Important Notes:</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>
              The agent must run on the same network as your target devices
            </li>
            <li>
              The agent requires access to send UDP broadcast packets (port 9)
            </li>
            <li>
              For best results, install on a machine that is always on (server,
              NAS, etc.)
            </li>
            <li>The agent will automatically register with this backend</li>
            <li>You can check agent status on this page after installation</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="p-4 bg-muted border rounded-md space-y-3">
        <h4 className="font-semibold">🔍 Verify Installation:</h4>
        <p className="text-sm text-muted-foreground">
          After installation, check if the agent is running:
        </p>
        <CodeBlock
          tabs={[
            {
              code: `sudo systemctl status powerbeacon-agent`,
              language: "bash",
              label: "Linux/macOS",
            },
            {
              code: `# If installed as service (with NSSM):\nGet-Service PowerBeaconAgent\n# Or if using scheduled task:\nGet-ScheduledTask "PowerBeacon Agent"`,
              language: "powershell",
              label: "Windows",
            },
          ]}
        />
        <p className="text-sm text-muted-foreground">
          The agent should appear on this page within 30 seconds of starting.
        </p>
      </div>

      <Alert variant="default">
        <AlertDescription>
          <h4 className="font-semibold mb-2">⚠️ Troubleshooting:</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>If the agent doesn't appear, check firewall rules</li>
            <li>Ensure the backend URL is accessible from the agent machine</li>
            <li>Check agent logs for connection errors</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
