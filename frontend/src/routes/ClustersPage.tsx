import { agentsApi } from "@/api/agents";
import { clustersApi } from "@/api/clusters";
import { deviceApi } from "@/api/devices";
import { useAuthStore } from "@/auth/useAuth";
import { ClusterCard } from "@/components/clusters/ClusterCard";
import { ClusterFormDialog } from "@/components/clusters/ClusterFormDialog";
import ClustersStats from "@/components/clusters/ClustersStats";
import { DeleteClusterDialog } from "@/components/clusters/DeleteClusterDialog";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import type { Agent, Cluster, Device } from "@/types";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const ClustersPage = () => {
  const { user, hasPermission } = useAuthStore();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState<Cluster | null>(null);
  const [deletingCluster, setDeletingCluster] = useState<Cluster | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const isViewer = user?.role === "viewer";
  const canManageClusters = hasPermission("manage_devices") && !isViewer;

  const manageableDevices = useMemo(() => {
    if (!user) {
      return devices;
    }
    if (user.role === "admin" || user.role === "superuser") {
      return devices;
    }
    return devices.filter((device) => device.owner_id === user.id);
  }, [devices, user]);

  const loadClusters = async () => {
    try {
      setError(null);
      const data = await clustersApi.list();
      setClusters(data);
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(apiError.response?.data?.detail || "Failed to load clusters");
    }
  };

  const loadReferenceData = async () => {
    try {
      const [deviceResponse, agentsResponse] = await Promise.all([
        deviceApi.list(),
        agentsApi.getAll(),
      ]);
      setDevices(deviceResponse.data.devices);
      setAgents(agentsResponse);
    } catch {
      // Reference data is only needed for editing forms.
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    setLoading(true);
    await Promise.all([loadClusters(), loadReferenceData()]);
    toast.success("Clusters refreshed successfully");
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([loadClusters(), loadReferenceData()]);
      setLoading(false);
    };

    void loadInitialData();
  }, []);

  const filteredClusters = useMemo(() => {
    return clusters.filter((cluster) => {
      const query = searchQuery.toLowerCase();
      return (
        cluster.name.toLowerCase().includes(query) ||
        (cluster.description || "").toLowerCase().includes(query) ||
        cluster.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [clusters, searchQuery]);

  const handleCreateCluster = async (payload: {
    name: string;
    description?: string;
    tags?: string[];
    device_ids: string[];
    agent_ids: string[];
  }) => {
    try {
      await clustersApi.create(payload);
      toast.success("Cluster created successfully");
      refreshAll();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(
        apiError.response?.data?.detail || "Failed to create cluster",
      );
    }
  };

  const handleUpdateCluster = async (payload: {
    name: string;
    description?: string;
    tags?: string[];
    device_ids: string[];
    agent_ids: string[];
  }) => {
    if (!editingCluster) {
      return;
    }

    try {
      await clustersApi.update(editingCluster.id, payload);
      toast.success("Cluster updated successfully");
      setEditingCluster(null);
      refreshAll();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(
        apiError.response?.data?.detail || "Failed to update cluster",
      );
    }
  };

  const handleDeleteCluster = async () => {
    if (!deletingCluster) {
      return;
    }

    try {
      await clustersApi.delete(deletingCluster.id);
      toast.success(`${deletingCluster.name} has been deleted`);
      setDeletingCluster(null);
      refreshAll();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(
        apiError.response?.data?.detail || "Failed to delete cluster",
      );
    }
  };

  const openEditDialog = async (cluster: Cluster) => {
    setEditingCluster(cluster);
    setIsFormOpen(true);
    try {
      const details = await clustersApi.getById(cluster.id);
      setSelectedDeviceIds(details.devices.map((device) => device.id));
      setSelectedAgentIds(details.agents.map((agent) => agent.id));
    } catch {
      setSelectedDeviceIds([]);
      setSelectedAgentIds([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clusters</h1>
          <p className="text-muted-foreground">
            Organize devices and agents into reusable wake orchestration groups.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {canManageClusters && (
            <Button
              size="sm"
              onClick={() => {
                setEditingCluster(null);
                setSelectedDeviceIds([]);
                setSelectedAgentIds([]);
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Cluster
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <ClustersStats
        total={clusters.length}
        clusteredDevices={clusters.reduce(
          (sum, cluster) => sum + cluster.device_count,
          0,
        )}
        clusteredAgents={clusters.reduce(
          (sum, cluster) => sum + cluster.agent_count,
          0,
        )}
      />

      <div className="rounded-xl border border-border bg-card p-4">
        <InputGroup>
          <InputGroupInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search clusters by name, description, or tag"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Spinner className="size-10" />
        </div>
      ) : filteredClusters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <h2 className="text-lg font-medium text-foreground">
            No clusters found
          </h2>
          <p className="mt-2 text-muted-foreground">
            {searchQuery
              ? "Try a different search query."
              : "Create a cluster to organize devices and agents."}
          </p>
          {!searchQuery && (
            <div className="mt-4">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-primary hover:underline"
              >
                Manage individual devices on the dashboard
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClusters.map((cluster) => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              canManage={canManageClusters}
              onEdit={openEditDialog}
              onDelete={setDeletingCluster}
            />
          ))}
        </div>
      )}

      <ClusterFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingCluster(null);
            setSelectedDeviceIds([]);
            setSelectedAgentIds([]);
          }
        }}
        cluster={editingCluster}
        devices={manageableDevices}
        agents={agents}
        initialDeviceIds={selectedDeviceIds}
        initialAgentIds={selectedAgentIds}
        onSubmit={editingCluster ? handleUpdateCluster : handleCreateCluster}
      />

      <DeleteClusterDialog
        cluster={deletingCluster}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCluster(null);
          }
        }}
        onConfirm={handleDeleteCluster}
      />
    </div>
  );
};

export default ClustersPage;
