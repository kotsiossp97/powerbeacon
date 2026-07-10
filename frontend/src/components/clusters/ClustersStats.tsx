import { Boxes, Monitor, Server } from "lucide-react";
import React from "react";

interface ClustersStatsProps {
  total: number;
  clusteredDevices: number;
  clusteredAgents: number;
}

const ClustersStats: React.FC<ClustersStatsProps> = ({
  total,
  clusteredDevices,
  clusteredAgents,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
            <Boxes className="text-foreground h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">{total}</p>
            <p className="text-muted-foreground text-sm">Total Clusters</p>
          </div>
        </div>
      </div>
      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
            <Monitor className="text-foreground h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">
              {clusteredDevices}
            </p>
            <p className="text-muted-foreground text-sm">Clustered Devices</p>
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
              {clusteredAgents}
            </p>
            <p className="text-muted-foreground text-sm">Clustered Agents</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClustersStats;
