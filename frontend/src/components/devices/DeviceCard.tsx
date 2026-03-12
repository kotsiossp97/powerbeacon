/**
 * Device card component
 */
import { type Device } from "@/types";
import { deviceApi } from "@/api/devices";
import { useAuthStore } from "@/auth/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import {
  Power,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import osIcons from "../misc/os-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DeviceCardProps {
  device: Device;
  onEdit?: (device: Device) => void;
  onDelete?: (device: Device) => void;
}

export const DeviceCard = ({ device, onEdit, onDelete }: DeviceCardProps) => {
  const { user, hasPermission } = useAuthStore();
  const [isWaking, setIsWaking] = useState(false);

  const canManageDevice =
    hasPermission("manage_devices") || device.owner_id === user?.id;
  const canWake = hasPermission("wake_device");
  const isViewer = user?.role === "viewer";

  const handleWake = async () => {
    setIsWaking(true);
    try {
      const response = await deviceApi.wake(device.id);
      toast.success(
        response.data?.message || "Wake command sent successfully!",
      );
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to wake device",
      );
    } finally {
      setIsWaking(false);
    }
  };

  const handleCopyMac = () => {
    navigator.clipboard.writeText(device.mac_address);
    toast.success("MAC address copied to clipboard");
  };

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary text-foreground">
              {osIcons[device.os_type] || osIcons.other}
            </div>
            <div>
              <h3 className="font-medium text-foreground leading-tight">
                {device.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {device.ip_address || "IP not available"}
              </p>
            </div>
          </div>
          {canManageDevice && !isViewer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyMac}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy MAC Address
                </DropdownMenuItem>
                {onEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(device)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Device
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(device)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Device
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={device.is_active ? "border-success text-success" : "border-muted-foreground text-muted-foreground"}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${device.is_active ? "bg-success" : "bg-muted-foreground"}`}
            />
            {device.is_active ? "Active" : "Inactive"}
          </Badge>
          {device.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-secondary text-secondary-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">MAC Address</span>
            <span className="font-mono text-foreground">
              {device.mac_address}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Owner</span>
            <span className="text-foreground">{device.owner_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Agent</span>
            <span className="text-foreground">
              {device.agent_hostname ?? (
                <span className="text-muted-foreground italic">None</span>
              )}
            </span>
          </div>
          {device.created_at && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="text-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(device.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {!isViewer && canWake && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleWake}
              disabled={isWaking}
            >
              <Power className="mr-2 h-4 w-4" />
              {isWaking ? "Waking..." : "Wake"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
