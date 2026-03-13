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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
            <Boxes className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{total}</p>
            <p className="text-sm text-muted-foreground">Total Clusters</p>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
            <Monitor className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {clusteredDevices}
            </p>
            <p className="text-sm text-muted-foreground">Clustered Devices</p>
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
              {clusteredAgents}
            </p>
            <p className="text-sm text-muted-foreground">Clustered Agents</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClustersStats;
