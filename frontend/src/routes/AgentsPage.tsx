/**
 * Agents management page
 */
import { agentsApi } from "@/api/agents";
import { useAuthStore } from "@/auth/useAuth";
import {
  AgentInstallInstructions,
  DeleteAgentDialog,
} from "@/components/agents";
import {
  AgentsFilters,
  AgentsGrid,
  AgentsStats,
} from "@/components/agents/page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Agent } from "@/types";
import { AlertCircleIcon, Download, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const AgentsPage = () => {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    toast.success("IP address copied to clipboard");
  };

  const handleDeleteAgent = async () => {
    if (!agentToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await agentsApi.delete(agentToDelete.id);
      toast.success("Agent deleted successfully");
      setAgentToDelete(null);
      await loadAgents();
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || "Failed to delete agent");
    } finally {
      setIsDeleting(false);
    }
  };

  const loadAgents = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const data = await agentsApi.getAll();
      setAgents(data);
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      setError(apiError.response?.data?.detail || "Failed to load agents");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAgents();

    const interval = setInterval(() => {
      loadAgents();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.ip.includes(searchQuery);

      const matchesStatus =
        statusFilter === "all" || agent.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [agents, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: agents.length,
      online: agents.filter((agent) => agent.status === "online").length,
    };
  }, [agents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agents</h1>
          <p className="text-muted-foreground">
            Monitor connected Wake-on-LAN agents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAgents}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsInstallDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Install Agent
          </Button>
        </div>
      </div>

      <AgentsStats total={stats.total} online={stats.online} />

      <AgentsFilters
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchQueryChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
      />

      <AgentsGrid
        agents={filteredAgents}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        currentUserId={user?.id}
        currentUserRole={user?.role}
        onCopyIp={handleCopyIp}
        onRequestDelete={setAgentToDelete}
      />

      {error && (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircleIcon />
          <AlertTitle>Error Fetching Agents</AlertTitle>
          <AlertDescription>
            An error occured while trying to fetch agents: {error}
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
        <DialogContent
          className="sm:max-w-4xl pb-0"
          aria-describedby="Agent installation instructions dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Install PowerBeacon Agent
            </DialogTitle>
            <DialogDescription className="hidden">
              Install the PowerBeacon agent on a machine in your local network
              to enable Wake-on-LAN functionality.
            </DialogDescription>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[80svh] overflow-y-auto px-4">
            <AgentInstallInstructions />
            <DialogFooter className="mb-0 mt-2">
              <Button
                variant="outline"
                onClick={() => setIsInstallDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteAgentDialog
        agent={agentToDelete}
        isDeleting={isDeleting}
        onOpenChange={(open: boolean) => {
          if (!open && !isDeleting) {
            setAgentToDelete(null);
          }
        }}
        onConfirm={handleDeleteAgent}
      />
    </div>
  );
};
