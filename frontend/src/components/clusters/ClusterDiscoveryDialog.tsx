import { clustersApi } from "@/api/clusters";
import { deviceApi } from "@/api/devices";
import { DeviceFormDialog } from "@/components/devices/DeviceFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ClusterDetail,
  DeviceCreate,
  DeviceUpdate,
  NetworkDiscoveryResult,
} from "@/types";
import { Network, PlusIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ClusterDiscoveryDialogProps {
  cluster: ClusterDetail | null;
}

const getFriendlyDiscoveredDeviceName = (
  device: NetworkDiscoveryResult["devices"][number],
) => {
  if (device.hostname) {
    return device.hostname;
  }

  if (device.ip) {
    return `Device ${device.ip}`;
  }

  if (device.mac) {
    return `Device ${device.mac.slice(-8).replace(/:/g, "")}`;
  }

  return "Discovered device";
};

const DiscoveredDeviceItem: React.FC<{
  device: NetworkDiscoveryResult["devices"][number];
  onAdd: (device: NetworkDiscoveryResult["devices"][number]) => void;
}> = ({ device, onAdd }) => {
  return (
    <Item variant={"outline"}>
      <ItemMedia variant="icon">
        <div
          className={cn(
            "mt-1 h-3 w-3 animate-pulse rounded-full",
            device.online ? "bg-green-500" : "bg-muted-foreground",
          )}
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{getFriendlyDiscoveredDeviceName(device)}</ItemTitle>
        <ItemDescription>
          <div className="flex h-5 items-center gap-3">
            <p>{device.ip}</p>
            <Separator orientation="vertical" />
            <pre>{device.mac}</pre>
          </div>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="rounded-full"
              onClick={() => onAdd(device)}
            >
              <PlusIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add this device to the cluster</TooltipContent>
        </Tooltip>
      </ItemActions>
    </Item>
  );
};

const ClusterDiscoveryDialog: React.FC<ClusterDiscoveryDialogProps> = ({
  cluster,
}) => {
  const [open, setOpen] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [deviceDraft, setDeviceDraft] = useState<null | {
    name: string;
    mac_address: string;
    ip_address: string;
    cluster_id: string;
    agent_ids: string[];
    os_type: "linux" | "windows" | "macos";
    description?: string;
    tags?: string;
  }>(null);
  const [discoveryResults, setDiscoveryResults] =
    useState<NetworkDiscoveryResult | null>(null);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setDiscoveryResults(null);
    }
  }, []);

  const handleDiscoverNetwork = useCallback(async () => {
    if (!cluster) {
      return;
    }

    try {
      setIsDiscovering(true);
      const response = await clustersApi.discoverNetwork(cluster.id);
      setDiscoveryResults(response.data);
      toast.success(
        response.data.count > 0
          ? `Discovered ${response.data.count} reachable device(s)`
          : "Network discovery completed. No reachable devices were found.",
      );
    } catch (err) {
      const apiError = err as {
        response?: { data?: { detail?: string | object[] } };
      };
      const detail = apiError.response?.data?.detail;
      if (Array.isArray(detail)) {
        toast.error(
          detail
            .map((d: { msg?: string }) => d.msg || JSON.stringify(d))
            .join("; "),
        );
      } else {
        toast.error(detail || "Failed to discover network devices");
      }
    } finally {
      setIsDiscovering(false);
    }
  }, [cluster]);

  const handleAddDiscoveredDevice = useCallback(
    (device: NetworkDiscoveryResult["devices"][number]) => {
      if (!cluster) {
        return;
      }

      const selectedAgentIds =
        cluster.agents.length > 0 ? [cluster.agents[0].id] : [];

      setDeviceDraft({
        name: getFriendlyDiscoveredDeviceName(device),
        mac_address: device.mac,
        ip_address: device.ip || "",
        cluster_id: cluster.id,
        agent_ids: selectedAgentIds,
        os_type: "linux",
        description: "",
        tags: "",
      });
      setIsAddDeviceOpen(true);
    },
    [cluster],
  );

  const handleCreateDiscoveredDevice = useCallback(
    async (data: DeviceCreate | DeviceUpdate) => {
      try {
        await deviceApi.create(data as DeviceCreate);
        toast.success("Device created successfully");
        setIsAddDeviceOpen(false);
        setDeviceDraft(null);
      } catch (err) {
        const apiError = err as { response?: { data?: { detail?: string } } };
        toast.error(
          apiError.response?.data?.detail || "Failed to create device",
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (!open || !cluster) {
      return;
    }

    let isCancelled = false;

    const discover = async () => {
      try {
        await handleDiscoverNetwork();
      } catch {
        return;
      }

      if (isCancelled) {
        return;
      }
    };

    void discover();

    return () => {
      isCancelled = true;
    };
  }, [open, cluster, handleDiscoverNetwork]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger>
          <Button variant="secondary" disabled={isDiscovering}>
            <Network className="mr-2 h-4 w-4" />
            {isDiscovering ? "Discovering..." : "Discover Network"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Discover Network</DialogTitle>
            <DialogDescription>
              Discover network devices connected to the cluster's online agents.
            </DialogDescription>
          </DialogHeader>
          {isDiscovering && (
            <div className="flex flex-col items-center gap-4">
              <Spinner />
              <p>Discovering network devices...</p>
            </div>
          )}
          {!isDiscovering && discoveryResults && (
            <div className="mt-2">
              <DialogTitle>Discovered Devices</DialogTitle>
              <Separator className="my-2" />
              {discoveryResults.devices.length === 0 ? (
                <p className="text-muted-foreground">
                  No reachable devices were discovered on the cluster’s online
                  agents.
                </p>
              ) : (
                <ScrollArea className="max-h-96">
                  <ItemGroup>
                    {discoveryResults.devices.map((device) => (
                      <DiscoveredDeviceItem
                        key={`${device.mac}-${device.ip}`}
                        device={device}
                        onAdd={handleAddDiscoveredDevice}
                      />
                    ))}
                  </ItemGroup>
                </ScrollArea>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {cluster && (
        <DeviceFormDialog
          open={isAddDeviceOpen}
          onOpenChange={(nextOpen) => {
            setIsAddDeviceOpen(nextOpen);
            if (!nextOpen) {
              setDeviceDraft(null);
            }
          }}
          initialValues={deviceDraft}
          device={null}
          agents={cluster.agents}
          clusters={[cluster]}
          onSubmit={handleCreateDiscoveredDevice}
        />
      )}
    </>
  );
};

export default ClusterDiscoveryDialog;
