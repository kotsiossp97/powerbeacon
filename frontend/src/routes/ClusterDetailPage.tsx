import { agentsApi } from "@/api/agents";
import { clustersApi } from "@/api/clusters";
import { deviceApi } from "@/api/devices";
import { useAuthStore } from "@/auth/useAuth";
import { ClusterFormDialog } from "@/components/clusters/ClusterFormDialog";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Agent, ClusterDetail, Device } from "@/types";
import { ArrowLeft, Network, Power, RefreshCw, Server } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

const ClusterDetailPage = () => {
  const { clusterId } = useParams();
  const { user, hasPermission } = useAuthStore();
  const [cluster, setCluster] = useState<ClusterDetail | null>(null);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const canManageCluster = hasPermission("manage_devices") && user?.role !== "viewer";
  const canWakeCluster = hasPermission("wake_device") && user?.role !== "viewer";

  useEffect(() => {
    const loadCluster = async () => {
      if (!clusterId) {
        return;
      }

      try {
        setError(null);
        const clusterData = await clustersApi.getById(clusterId);
        setCluster(clusterData);

        if (canManageCluster) {
          const [devicesResponse, agentsResponse] = await Promise.all([
            deviceApi.list(),
            agentsApi.getAll(),
          ]);
          setAllDevices(devicesResponse.data.devices);
          setAllAgents(agentsResponse);
        }
      } catch (err) {
        const apiError = err as { response?: { data?: { detail?: string } } };
        setError(apiError.response?.data?.detail || "Failed to load cluster details");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    void loadCluster();
  }, [canManageCluster, clusterId, reloadToken]);

  const manageableDevices = useMemo(() => {
    if (!user) {
      return allDevices;
    }
    if (user.role === "admin" || user.role === "superuser") {
      return allDevices;
    }
    return allDevices.filter((device) => device.owner_id === user.id);
  }, [allDevices, user]);

  const handleWakeCluster = async () => {
    if (!cluster) {
      return;
    }
    try {
      const response = await clustersApi.wake(cluster.id);
      toast.success(response.data?.message || "Cluster wake dispatched successfully");
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || "Failed to wake cluster");
    }
  };

  const handleUpdateCluster = async (payload: {
    name: string;
    description?: string;
    tags?: string[];
    device_ids: string[];
    agent_ids: string[];
  }) => {
    if (!cluster) {
      return;
    }

    try {
      await clustersApi.update(cluster.id, payload);
      toast.success("Cluster updated successfully");
      setRefreshing(true);
      setLoading(true);
      setReloadToken((current) => current + 1);
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || "Failed to update cluster");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading cluster...
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="space-y-4">
        <Link to="/clusters" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to clusters
        </Link>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {error || "Cluster not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link to="/clusters" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to clusters
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{cluster.name}</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              {cluster.description || "No description provided for this cluster."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {cluster.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setRefreshing(true);
              setLoading(true);
              setReloadToken((current) => current + 1);
            }}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canWakeCluster && (
            <Button onClick={handleWakeCluster}>
              <Power className="mr-2 h-4 w-4" />
              Wake Cluster
            </Button>
          )}
          {canManageCluster && (
            <Button variant="secondary" onClick={() => setIsFormOpen(true)}>
              Edit Cluster
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Devices</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{cluster.devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Agents</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">{cluster.agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Owner</div>
            <div className="mt-2 text-xl font-semibold text-foreground">{cluster.owner_name || "Unknown"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Cluster Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cluster.devices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
                This cluster has no devices yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {cluster.devices.map((device) => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Cluster Agents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cluster.agents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
                This cluster has no agents yet.
              </div>
            ) : (
              cluster.agents.map((agent) => (
                <div key={agent.id} className="rounded-lg border border-border bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-foreground">{agent.hostname}</div>
                      <div className="text-sm text-muted-foreground">{agent.ip}</div>
                    </div>
                    <Badge variant={agent.status === "online" ? "outline" : "secondary"}>
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Assigned devices</span>
                    <span className="text-foreground">{agent.device_count}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <ClusterFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        cluster={cluster}
        devices={manageableDevices}
        agents={allAgents}
        initialDeviceIds={cluster.devices.map((device) => device.id)}
        initialAgentIds={cluster.agents.map((agent) => agent.id)}
        onSubmit={handleUpdateCluster}
      />
    </div>
  );
};

export default ClusterDetailPage;