import type { UserRole, Permission } from "@/types";

const rolePermissions: Record<UserRole, Permission[]> = {
  superuser: [
    "manage_users",
    "manage_devices",
    "manage_agents",
    "wake_device",
    "view_devices",
    "view_users",
    "view_agents",
    "manage_settings",
  ],
  admin: [
    "manage_users",
    "manage_devices",
    "manage_agents",
    "wake_device",
    "view_devices",
    "view_users",
    "view_agents",
  ],
  user: [
    "manage_devices",
    "wake_device",
    "view_devices",
    "view_agents",
  ],
  viewer: ["view_devices"],
};

export default rolePermissions;