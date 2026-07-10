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

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
            <Monitor className="text-foreground h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">
              {totalDevices}
            </p>
            <p className="text-muted-foreground text-sm">Devices</p>
          </div>
        </div>
      </div>
      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
            <Server className="text-foreground h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">
              {totalAgents}
            </p>
            <p className="text-muted-foreground text-sm">Agents</p>
          </div>
        </div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
            <User className="text-foreground h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">
              {ownerName}
            </p>
            <p className="text-muted-foreground text-sm">Owner</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleClusterStats;
