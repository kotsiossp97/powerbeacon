import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Cluster } from "@/types";
import { Edit, MoreVertical, Network, Trash2 } from "lucide-react";
import { Link } from "react-router";

interface ClusterCardProps {
  cluster: Cluster;
  canManage: boolean;
  onEdit: (cluster: Cluster) => void;
  onDelete: (cluster: Cluster) => void;
}

export const ClusterCard = ({
  cluster,
  canManage,
  onEdit,
  onDelete,
}: ClusterCardProps) => {
  return (
    <Card className="border border-card hover:border-primary/40 transition-colors shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link
              to={`/clusters/${cluster.id}`}
              className="text-lg font-semibold text-foreground hover:text-primary"
            >
              {cluster.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {cluster.description || "No description provided."}
            </p>
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(cluster)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Cluster
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(cluster)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Cluster
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {cluster.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          {cluster.tags.length === 0 && (
            <Badge variant="outline">No tags</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <div className="text-muted-foreground">Devices</div>
            <div className="mt-1 text-xl font-semibold text-foreground">
              {cluster.device_count}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <div className="text-muted-foreground">Agents</div>
            <div className="mt-1 text-xl font-semibold text-foreground">
              {cluster.agent_count}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Network className="h-4 w-4" />
          <span>Owner: {cluster.owner_name || "Unknown"}</span>
        </div>
      </CardContent>
    </Card>
  );
};
