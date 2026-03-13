import { Monitor, Server, User } from "lucide-react";
import React from "react";

interface SingleClusterStatsProps {
  totalDevices: number;
  totalAgents: number;
  ownerName: string;
}

const SingleClusterStats: React.FC<SingleClusterStatsProps> = ({
  totalDevices,
  totalAgents,
  ownerName,
}) => {
  return (
    // <div>SingleClusterStats</div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
            <Monitor className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {totalDevices}
            </p>
            <p className="text-sm text-muted-foreground">Devices</p>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
            <Server className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {totalAgents}
            </p>
            <p className="text-sm text-muted-foreground">Agents</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
            <User className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {ownerName}
            </p>
            <p className="text-sm text-muted-foreground">Owner</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleClusterStats;
