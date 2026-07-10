import { UserCheck, Users as UsersIcon, Shield } from "lucide-react";

interface UsersStatsProps {
  total: number;
  active: number;
  admins: number;
}

export const UsersStats = ({ total, active, admins }: UsersStatsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
            <UsersIcon className="text-foreground h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">{total}</p>
            <p className="text-muted-foreground text-sm">Total Users</p>
          </div>
        </div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-success/20 flex h-10 w-10 items-center justify-center rounded-lg">
            <UserCheck className="text-success h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">{active}</p>
            <p className="text-muted-foreground text-sm">Active</p>
          </div>
        </div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg">
            <Shield className="text-primary h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground text-2xl font-semibold">{admins}</p>
            <p className="text-muted-foreground text-sm">Admins</p>
          </div>
        </div>
      </div>
    </div>
  );
};
