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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
            <Monitor className="text-foreground h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">{total}</p>
            <p className="text-muted-foreground text-sm">Total Devices</p>
          </div>
        </div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-success/20 flex h-10 w-10 items-center justify-center rounded-lg">
            <div className="bg-success h-3 w-3 rounded-full" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">{active}</p>
            <p className="text-muted-foreground text-sm">Active</p>
          </div>
        </div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
            <div className="bg-muted-foreground h-3 w-3 rounded-full" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">{inactive}</p>
            <p className="text-muted-foreground text-sm">Inactive</p>
          </div>
        </div>
      </div>
    </div>
  );
};
