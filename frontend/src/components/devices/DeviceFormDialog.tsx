/**
 * Device form dialog component
 */
import type { DeviceFormData } from "@/components/devices/deviceForm";
import {
    deviceFormSchema,
    getDeviceFormDefaults,
    mapDeviceFormToPayload,
} from "@/components/devices/deviceForm";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    type Agent,
    type Cluster,
    type Device,
    type DeviceCreate,
    type DeviceUpdate,
} from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

interface DeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: Device | null;
  agents: Agent[];
  clusters: Cluster[];
  onSubmit: (data: DeviceCreate | DeviceUpdate) => void;
}

export const DeviceFormDialog = ({
  open,
  onOpenChange,
  device,
  agents,
  clusters,
  onSubmit,
}: DeviceFormDialogProps) => {
  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: getDeviceFormDefaults(),
  });

  // Reset form when dialog opens or device changes
  // When creating, default to the first available agent
  useEffect(() => {
    if (open) {
      form.reset(getDeviceFormDefaults(device));
    }
  }, [open, device, agents, form]);

  const selectedClusterId = useWatch({
    control: form.control,
    name: "cluster_id",
    defaultValue: "",
  });
  const selectedAgentIds = useWatch({
    control: form.control,
    name: "agent_ids",
    defaultValue: [],
  });
  const selectedOsType = useWatch({
    control: form.control,
    name: "os_type",
    defaultValue: "linux",
  });
  const availableAgents = agents.filter((agent) => {
    if (!selectedClusterId) {
      return !agent.cluster_id;
    }
    return agent.cluster_id === selectedClusterId;
  });

  useEffect(() => {
    const availableAgentIds = new Set(availableAgents.map((agent) => agent.id));
    const filteredAgentIds = selectedAgentIds.filter((agentId) =>
      availableAgentIds.has(agentId),
    );
    if (filteredAgentIds.length !== selectedAgentIds.length) {
      form.setValue("agent_ids", filteredAgentIds, { shouldDirty: true });
      return;
    }

    // For new devices, auto-select the first matching cluster agent
    // when a cluster is chosen and no agent has been selected yet.
    if (
      !device &&
      selectedClusterId &&
      filteredAgentIds.length === 0 &&
      availableAgents.length > 0
    ) {
      form.setValue("agent_ids", [availableAgents[0].id], { shouldDirty: true });
    }
  }, [availableAgents, device, form, selectedAgentIds, selectedClusterId]);

  const toggleAgentSelection = (agentId: string) => {
    const nextAgentIds = selectedAgentIds.includes(agentId)
      ? selectedAgentIds.filter((currentId) => currentId !== agentId)
      : [...selectedAgentIds, agentId];
    form.setValue("agent_ids", nextAgentIds, { shouldDirty: true });
  };

  const handleSubmit = (data: DeviceFormData) => {
    onSubmit(mapDeviceFormToPayload(data));

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{device ? "Edit Device" : "Add Device"}</DialogTitle>
          <DialogDescription>
            {device
              ? "Update the device information below."
              : "Add a new device to monitor and manage."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.name || undefined}>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("name")}
                  placeholder="My Device"
                  aria-invalid={!!form.formState.errors.name}
                />
              </FieldContent>
              {form.formState.errors.name && (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!form.formState.errors.mac_address || undefined}>
              <FieldLabel>MAC Address</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("mac_address")}
                  placeholder="00:11:22:33:44:55"
                  aria-invalid={!!form.formState.errors.mac_address}
                />
              </FieldContent>
              <FieldDescription>Format: XX:XX:XX:XX:XX:XX</FieldDescription>
              {form.formState.errors.mac_address && (
                <FieldError>{form.formState.errors.mac_address.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!form.formState.errors.ip_address || undefined}>
              <FieldLabel>IP Address (Optional)</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("ip_address")}
                  placeholder="192.168.1.100"
                  aria-invalid={!!form.formState.errors.ip_address}
                />
              </FieldContent>
              {form.formState.errors.ip_address && (
                <FieldError>{form.formState.errors.ip_address.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!form.formState.errors.os_type || undefined}>
              <FieldLabel>Operating System</FieldLabel>
              <FieldContent>
                <Select
                  value={selectedOsType}
                  onValueChange={(value) =>
                    form.setValue("os_type", value as "linux" | "windows" | "macos")
                  }
                >
                  <SelectTrigger aria-invalid={!!form.formState.errors.os_type}>
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linux">Linux</SelectItem>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="macos">macOS</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
              {form.formState.errors.os_type && (
                <FieldError>{form.formState.errors.os_type.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!form.formState.errors.description || undefined}>
              <FieldLabel>Description (Optional)</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("description")}
                  placeholder="Desktop computer in office"
                  aria-invalid={!!form.formState.errors.description}
                />
              </FieldContent>
              {form.formState.errors.description && (
                <FieldError>{form.formState.errors.description.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!form.formState.errors.tags || undefined}>
              <FieldLabel>Tags (Optional)</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("tags")}
                  placeholder="office, desktop, production"
                  aria-invalid={!!form.formState.errors.tags}
                />
              </FieldContent>
              <FieldDescription>Separate tags with commas</FieldDescription>
              {form.formState.errors.tags && (
                <FieldError>{form.formState.errors.tags.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Cluster</FieldLabel>
              <FieldContent>
                <Select
                  value={selectedClusterId || "__none__"}
                  onValueChange={(value) =>
                    form.setValue("cluster_id", value === "__none__" ? "" : value, {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No cluster</SelectItem>
                    {clusters.map((cluster) => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>
                Devices can only use agents from the same cluster.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Associated Agents</FieldLabel>
              <FieldContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      disabled={availableAgents.length === 0}
                    >
                      <span>
                        {selectedAgentIds.length > 0
                          ? `${selectedAgentIds.length} agent(s) selected`
                          : availableAgents.length > 0
                            ? "Select agents"
                            : "No matching agents available"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-64 w-80">
                    <DropdownMenuLabel>Wake-on-LAN agents</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableAgents.map((agent) => (
                      <DropdownMenuCheckboxItem
                        key={agent.id}
                        checked={selectedAgentIds.includes(agent.id)}
                        onCheckedChange={() => toggleAgentSelection(agent.id)}
                      >
                        <span className="flex w-full items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                agent.status === "online"
                                  ? "bg-green-500"
                                  : "bg-muted-foreground"
                              }`}
                            />
                            {agent.hostname}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {agent.ip}
                          </span>
                        </span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </FieldContent>
              <FieldDescription>
                All selected agents will receive the wake request for this device.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {device ? "Update" : "Create"} Device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
