import { agentsApi } from "@/api/agents";
import { clustersApi } from "@/api/clusters";
import { deviceApi } from "@/api/devices";
import { useAuthStore } from "@/auth/useAuth";
import {
    DashboardFilters,
    DashboardStats,
    DeleteDeviceDialog,
    DeviceGridSection,
} from "@/components/dashboard";
import { DeviceFormDialog } from "@/components/devices/DeviceFormDialog";
import { Button } from "@/components/ui/button";
import type { Agent, Cluster, Device, DeviceCreate, DeviceUpdate } from "@/types";
import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const DashboardPage = () => {
  const { user, hasPermission } = useAuthStore();

  const [devices, setDevices] = useState<Device[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [osFilter, setOsFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isViewer = user?.role === "viewer";
  const canManageDevices = hasPermission("manage_devices");

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await deviceApi.list();
      setDevices(response.data.devices);
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(apiError.response?.data?.detail || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const data = await agentsApi.getAll();
      setAgents(data);
    } catch {
      // Non-admin users may not have permission; silently ignore
    }
  };

  const fetchClusters = async () => {
    try {
      const data = await clustersApi.list();
      setClusters(data);
    } catch {
      // Viewers and restricted users can still use the dashboard without cluster metadata.
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchAgents();
    fetchClusters();
  }, []);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.ip_address?.includes(searchQuery) ||
        device.mac_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesOS = osFilter === "all" || device.os_type === osFilter;
      return matchesSearch && matchesOS;
    });
  }, [devices, searchQuery, osFilter]);

  const stats = useMemo(() => {
    return {
      total: devices.length,
      active: devices.filter((device) => device.is_active).length,
      inactive: devices.filter((device) => !device.is_active).length,
    };
  }, [devices]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDevices();
    toast.success("Devices refreshed successfully");
    setIsRefreshing(false);
  };

  const handleCreateDevice = async (data: DeviceCreate | DeviceUpdate) => {
    try {
      await deviceApi.create(data as DeviceCreate);
      toast.success("Device created successfully");
      fetchDevices();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || "Failed to create device");
    }
  };

  const handleUpdateDevice = async (data: DeviceCreate | DeviceUpdate) => {
    if (!editingDevice) return;

    try {
      await deviceApi.update(editingDevice.id, data as DeviceUpdate);
      toast.success("Device updated successfully");
      setEditingDevice(null);
      fetchDevices();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || "Failed to update device");
    }
  };

  const handleDeleteDevice = async () => {
    if (!deletingDevice) return;

    try {
      await deviceApi.delete(deletingDevice.id);
      toast.success(`${deletingDevice.name} has been deleted`);
      setDeletingDevice(null);
      fetchDevices();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || "Failed to delete device");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your network devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {canManageDevices && !isViewer && (
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
          {error}
        </div>
      )}

      <DashboardStats
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
      />

      <DashboardFilters
        searchQuery={searchQuery}
        osFilter={osFilter}
        onSearchQueryChange={setSearchQuery}
        onOsFilterChange={setOsFilter}
      />

      <DeviceGridSection
        loading={loading}
        devices={filteredDevices}
        searchQuery={searchQuery}
        osFilter={osFilter}
        canManageDevices={canManageDevices}
        isViewer={isViewer}
        onAddDevice={() => setIsFormOpen(true)}
        onEditDevice={(device) => {
          setEditingDevice(device);
          setIsFormOpen(true);
        }}
        onDeleteDevice={setDeletingDevice}
      />

      <DeviceFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingDevice(null);
          }
        }}
        device={editingDevice}
        agents={agents}
        clusters={clusters}
        onSubmit={editingDevice ? handleUpdateDevice : handleCreateDevice}
      />

      <DeleteDeviceDialog
        device={deletingDevice}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingDevice(null);
          }
        }}
        onConfirm={handleDeleteDevice}
      />
    </div>
  );
};

export default DashboardPage;
