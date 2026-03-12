import { Activity, Monitor, Server } from "lucide-react";

interface AgentsStatsProps {
  total: number;
  online: number;
}

export const AgentsStats = ({ total, online }: AgentsStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
            <Server className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{total}</p>
            <p className="text-sm text-muted-foreground">Total Agents</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/20">
            <Activity className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{online}</p>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/20">
            <Monitor className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{total - online}</p>
            <p className="text-sm text-muted-foreground">Offline</p>
          </div>
        </div>
      </div>
    </div>
  );
};
