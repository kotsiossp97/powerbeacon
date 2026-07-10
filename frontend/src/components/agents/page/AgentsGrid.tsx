import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";
import { Copy, MoreVertical, Server, Trash2 } from "lucide-react";
import { agentStatusConfig } from "./agentStatusConfig";

interface AgentsGridProps {
  agents: Agent[];
  searchQuery: string;
  statusFilter: string;
  currentUserId?: string;
  currentUserRole?: "superuser" | "admin" | "user" | "viewer";
  onCopyIp: (ip: string) => void;
  onRequestDelete: (agent: Agent) => void;
}

export const AgentsGrid = ({
  agents,
  searchQuery,
  statusFilter,
  currentUserId,
  currentUserRole,
  onCopyIp,
  onRequestDelete,
}: AgentsGridProps) => {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Server className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-foreground text-lg font-medium">No agents found</h3>
        <p className="text-muted-foreground">
          {searchQuery || statusFilter !== "all"
            ? "Try adjusting your filters"
            : "Deploy your first agent to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => {
        const status = agentStatusConfig[agent.status];
        const StatusIcon = status.icon;
        const canDeleteAgent =
          currentUserRole === "superuser" ||
          currentUserRole === "admin" ||
          agent.owner_id === currentUserId;

        return (
          <Card
            key={agent.id}
            className="bg-card border-border hover:border-primary/30 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary text-foreground flex h-10 w-10 items-center justify-center rounded-lg">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground leading-tight font-medium">
                      {agent.hostname}
                    </h3>
                    <p className="text-muted-foreground text-sm">{agent.ip}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onCopyIp(agent.ip)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy IP Address
                    </DropdownMenuItem>
                    {canDeleteAgent && (
                      <DropdownMenuItem
                        onClick={() => onRequestDelete(agent)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Agent
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("gap-1.5", status.className)}
                >
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground"
                >
                  v{agent.version}
                </Badge>
              </div>

              <div className="text-muted-foreground space-y-1 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span>Cluster</span>
                  <span className="text-foreground">
                    {agent.cluster_name || "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Owner</span>
                  <span className="text-foreground">
                    {agent.owner_name || "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Devices</span>
                  <span className="text-foreground">{agent.device_count}</span>
                </div>
              </div>

              {agent.status === "online" && (
                <div className="flex items-center gap-2 pt-2">
                  <div className="bg-secondary h-1.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-success h-full animate-pulse rounded-full"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <span className="text-success text-xs">Connected</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
