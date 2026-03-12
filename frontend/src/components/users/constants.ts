import { Eye, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import type { User, UserRole } from "@/types";

export const roleConfig: Record<
  UserRole,
  {
    label: string;
    icon: typeof Shield;
    className: string;
  }
> = {
  superuser: {
    label: "Superuser",
    icon: ShieldCheck,
    className: "bg-primary/20 text-primary border-primary/30",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    className: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  },
  user: {
    label: "User",
    icon: UserIcon,
    className: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    className: "bg-muted text-muted-foreground border-border",
  },
};

export const statusConfig = {
  active: {
    label: "Active",
    className: "bg-success/20 text-success border-success/30",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export const getUserInitials = (user: User) => {
  if (user.full_name) {
    return user.full_name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return user.username.slice(0, 2).toUpperCase();
};
