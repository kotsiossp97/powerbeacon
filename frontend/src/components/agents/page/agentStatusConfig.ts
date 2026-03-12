import { Wifi, WifiOff } from "lucide-react";

export const agentStatusConfig = {
  online: {
    label: "Online",
    className: "bg-success/20 text-success border-success/30",
    icon: Wifi,
  },
  offline: {
    label: "Offline",
    className: "bg-muted text-muted-foreground border-border",
    icon: WifiOff,
  },
};
