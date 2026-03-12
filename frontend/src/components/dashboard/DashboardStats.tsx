import { Monitor } from "lucide-react";

interface DashboardStatsProps {
  total: number;
  active: number;
  inactive: number;
}

export const DashboardStats = ({
  total,
  active,
  inactive,
}: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
            <Monitor className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{total}</p>
            <p className="text-sm text-muted-foreground">Total Devices</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/20">
            <div className="w-3 h-3 rounded-full bg-success" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{active}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{inactive}</p>
            <p className="text-sm text-muted-foreground">Inactive</p>
          </div>
        </div>
      </div>
    </div>
  );
};
