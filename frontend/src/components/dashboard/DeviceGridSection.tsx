import { Monitor, Plus } from "lucide-react";
import type { Device } from "@/types";
import { Button } from "@/components/ui/button";
import { DeviceCard } from "@/components/devices/DeviceCard";

interface DeviceGridSectionProps {
  loading: boolean;
  devices: Device[];
  searchQuery: string;
  osFilter: string;
  canManageDevices: boolean;
  isViewer: boolean;
  onAddDevice: () => void;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (device: Device) => void;
}

export const DeviceGridSection = ({
  loading,
  devices,
  searchQuery,
  osFilter,
  canManageDevices,
  isViewer,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
}: DeviceGridSectionProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-muted-foreground">Loading devices...</p>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">No devices found</h3>
        <p className="text-muted-foreground">
          {searchQuery || osFilter !== "all"
            ? "Try adjusting your filters"
            : "Add your first device to get started"}
        </p>
        {canManageDevices && !isViewer && !searchQuery && osFilter === "all" && (
          <Button className="mt-4" onClick={onAddDevice}>
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          onEdit={onEditDevice}
          onDelete={onDeleteDevice}
        />
      ))}
    </div>
  );
};
