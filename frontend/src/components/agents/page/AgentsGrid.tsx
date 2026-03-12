import { Copy, MoreVertical, Server } from "lucide-react";
import type { Agent } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { agentStatusConfig } from "./agentStatusConfig";

interface AgentsGridProps {
  agents: Agent[];
  searchQuery: string;
  statusFilter: string;
  onCopyIp: (ip: string) => void;
}

export const AgentsGrid = ({
  agents,
  searchQuery,
  statusFilter,
  onCopyIp,
}: AgentsGridProps) => {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Server className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">No agents found</h3>
        <p className="text-muted-foreground">
          {searchQuery || statusFilter !== "all"
            ? "Try adjusting your filters"
            : "Deploy your first agent to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => {
        const status = agentStatusConfig[agent.status];
        const StatusIcon = status.icon;

        return (
          <Card
            key={agent.id}
            className="bg-card border-border hover:border-primary/30 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary text-foreground">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground leading-tight">
                      {agent.hostname}
                    </h3>
                    <p className="text-sm text-muted-foreground">{agent.ip}</p>
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("gap-1.5", status.className)}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  v{agent.version}
                </Badge>
              </div>

              {agent.status === "online" && (
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full animate-pulse"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <span className="text-xs text-success">Connected</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
