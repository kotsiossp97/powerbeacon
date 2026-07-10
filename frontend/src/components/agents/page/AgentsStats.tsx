import { Activity, Monitor, Server } from "lucide-react";

interface AgentsStatsProps {
  total: number;
  online: number;
}

export const AgentsStats = ({ total, online }: AgentsStatsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
            <Server className="text-foreground h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">{total}</p>
            <p className="text-muted-foreground text-sm">Total Agents</p>
          </div>
        </div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-success/20 flex h-10 w-10 items-center justify-center rounded-lg">
            <Activity className="text-success h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">{online}</p>
            <p className="text-muted-foreground text-sm">Online</p>
          </div>
        </div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-warning/20 flex h-10 w-10 items-center justify-center rounded-lg">
            <Monitor className="text-warning h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">
              {total - online}
            </p>
            <p className="text-muted-foreground text-sm">Offline</p>
          </div>
        </div>
      </div>
    </div>
  );
};
