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
import {
  Edit,
  Monitor,
  MoreVertical,
  Network,
  Server,
  Trash2,
} from "lucide-react";
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
    <Card className="border-card hover:border-primary/40 border shadow-lg transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link
              to={`/clusters/${cluster.id}`}
              className="text-foreground hover:text-primary text-lg font-semibold"
            >
              {cluster.name}
            </Link>
            <p className="text-muted-foreground text-sm">
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
          <div className="border-border bg-background/60 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="bg-secondary flex h-8 w-8 items-center justify-center rounded">
                <Monitor className="text-foreground h-4 w-4" />
              </div>
              <div>
                <p className="text-foreground text-xl font-semibold">
                  {cluster.device_count}
                </p>
                <p className="text-muted-foreground">Devices</p>
              </div>
            </div>
          </div>
          <div className="border-border bg-background/60 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="bg-secondary flex h-8 w-8 items-center justify-center rounded">
                <Server className="text-foreground h-4 w-4" />
              </div>
              <div>
                <p className="text-foreground text-xl font-semibold">
                  {cluster.agent_count}
                </p>
                <p className="text-muted-foreground">Agents</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Network className="h-4 w-4" />
          <span>Owner: {cluster.owner_name || "Unknown"}</span>
        </div>
      </CardContent>
    </Card>
  );
};
