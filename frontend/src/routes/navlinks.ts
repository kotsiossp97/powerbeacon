import { useAuthStore } from "@/auth/useAuth";
import { Boxes, LayoutDashboard, Server, Settings, Users } from "lucide-react";

const navigationLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Clusters",
    href: "/clusters",
    icon: Boxes,
    permission: "view_devices" as const,
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    permission: "view_users" as const,
  },
  {
    name: "Agents",
    href: "/agents",
    icon: Server,
    permission: "view_agents" as const,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    // permission: "manage_settings" as const,
  },
];

export type NavigationLink = (typeof navigationLinks)[number];

export const useVisibleNavigationLinks = (): NavigationLink[] => {
  const { hasPermission } = useAuthStore();

  return navigationLinks.filter(
    (link) => !link.permission || hasPermission(link.permission),
  );
};

export default navigationLinks;
