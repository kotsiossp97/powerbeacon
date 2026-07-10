import React from "react";
import { CodeBlock } from "../ui/code-block";
import { getInstallCommand } from "../agents/instructions";

const OnboardingAgentInstructions: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-secondary rounded-lg p-4">
        <h4 className="text-foreground mb-3 text-sm font-medium">
          Install the Agent
        </h4>
        <p className="text-muted-foreground mb-4 text-sm">
          Run this command on any machine in your network to deploy a
          Wake-on-LAN agent:
        </p>
        <CodeBlock
          tabs={[
            {
              code: getInstallCommand("linux"),
              language: "bash",
              label: "Linux/macOS",
            },
            {
              code: getInstallCommand("windows"),
              language: "powershell",
              label: "Windows",
            },
          ]}
        />
      </div>
      <div className="bg-chart-2/10 border-chart-2/20 rounded-lg border p-4">
        <h4 className="text-chart-2 mb-2 text-sm font-medium">Skip for now?</h4>
        <p className="text-muted-foreground text-sm">
          You can always add agents later from the Agents page. Click
          &quot;Complete Setup&quot; to finish onboarding.
        </p>
      </div>
    </div>
  );
};

export default OnboardingAgentInstructions;
