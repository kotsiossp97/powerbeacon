import { UserCheck, Users as UsersIcon, Shield } from "lucide-react";

interface UsersStatsProps {
  total: number;
  active: number;
  admins: number;
}

export const UsersStats = ({ total, active, admins }: UsersStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
            <UsersIcon className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{total}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/20">
            <UserCheck className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{active}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{admins}</p>
            <p className="text-sm text-muted-foreground">Admins</p>
          </div>
        </div>
      </div>
    </div>
  );
};
