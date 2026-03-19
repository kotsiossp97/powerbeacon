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
import { Textarea } from "@/components/ui/textarea";
import type { Agent, Cluster, Device } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";

const clusterFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Name too long"),
  description: z.string().optional(),
  tags: z.string().optional(),
  device_ids: z.array(z.string()),
  agent_ids: z.array(z.string()),
});

type ClusterFormData = z.infer<typeof clusterFormSchema>;

interface ClusterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cluster?: Cluster | null;
  devices: Device[];
  agents: Agent[];
  initialDeviceIds?: string[];
  initialAgentIds?: string[];
  onSubmit: (payload: {
    name: string;
    description?: string;
    tags?: string[];
    device_ids: string[];
    agent_ids: string[];
  }) => void;
}

const getDefaults = (
  cluster?: Cluster | null,
  initialDeviceIds?: string[],
  initialAgentIds?: string[],
): ClusterFormData => ({
  name: cluster?.name || "",
  description: cluster?.description || "",
  tags: cluster?.tags?.join(", ") || "",
  device_ids: initialDeviceIds || [],
  agent_ids: initialAgentIds || [],
});

export const ClusterFormDialog = ({
  open,
  onOpenChange,
  cluster,
  devices,
  agents,
  initialDeviceIds,
  initialAgentIds,
  onSubmit,
}: ClusterFormDialogProps) => {
  const form = useForm<ClusterFormData>({
    resolver: zodResolver(clusterFormSchema),
    defaultValues: getDefaults(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaults(cluster, initialDeviceIds, initialAgentIds));
    }
  }, [cluster, devices, form, initialAgentIds, initialDeviceIds, open]);

  const selectedDeviceIds = useWatch({
    control: form.control,
    name: "device_ids",
    defaultValue: [],
  });
  const selectedAgentIds = useWatch({
    control: form.control,
    name: "agent_ids",
    defaultValue: [],
  });

  const toggleSelection = (field: "device_ids" | "agent_ids", id: string) => {
    const currentValues = form.getValues(field);
    const nextValues = currentValues.includes(id)
      ? currentValues.filter((currentId) => currentId !== id)
      : [...currentValues, id];
    form.setValue(field, nextValues, { shouldDirty: true });
  };

  const handleSubmit = (data: ClusterFormData) => {
    const tags = data.tags
      ? data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    onSubmit({
      name: data.name,
      description: data.description || undefined,
      tags,
      device_ids: data.device_ids,
      agent_ids: data.agent_ids,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl pb-0" aria-describedby="Cluster form dialog">
        <DialogHeader>
          <DialogTitle>
            {cluster ? "Edit Cluster" : "Create Cluster"}
          </DialogTitle>
          <DialogDescription>
            Group devices and agents together, then manage wake operations from
            a single place.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="-mx-4 no-scrollbar max-h-[80svh] overflow-y-auto px-4">
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.name || undefined}>
                <FieldLabel>Name</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("name")}
                    placeholder="Office workstations"
                  />
                </FieldContent>
                {form.formState.errors.name && (
                  <FieldError>{form.formState.errors.name.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Description</FieldLabel>
                <FieldContent>
                  <Textarea
                    {...form.register("description")}
                    placeholder="Describe what this cluster is used for"
                    rows={3}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Tags</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("tags")}
                    placeholder="office, desktops, lab"
                  />
                </FieldContent>
                <FieldDescription>Separate tags with commas.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Devices</FieldLabel>
                <FieldContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span>
                          {selectedDeviceIds.length > 0
                            ? `${selectedDeviceIds.length} device(s) selected`
                            : "Select devices"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-h-64 w-96"
                    >
                      <DropdownMenuLabel>Cluster devices</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {devices.map((device) => (
                        <DropdownMenuCheckboxItem
                          key={device.id}
                          checked={selectedDeviceIds.includes(device.id)}
                          onCheckedChange={() =>
                            toggleSelection("device_ids", device.id)
                          }
                        >
                          <span className="flex w-full items-center justify-between gap-3">
                            <span>{device.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {device.ip_address || device.mac_address}
                            </span>
                          </span>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </FieldContent>
                <FieldDescription>
                  Devices remain editable on the dashboard after cluster
                  assignment.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Agents</FieldLabel>
                <FieldContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <span>
                          {selectedAgentIds.length > 0
                            ? `${selectedAgentIds.length} agent(s) selected`
                            : "Select agents"}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-h-64 w-96"
                    >
                      <DropdownMenuLabel>Cluster agents</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {agents.map((agent) => (
                        <DropdownMenuCheckboxItem
                          key={agent.id}
                          checked={selectedAgentIds.includes(agent.id)}
                          onCheckedChange={() =>
                            toggleSelection("agent_ids", agent.id)
                          }
                        >
                          <span className="flex w-full items-center justify-between gap-3">
                            <span>{agent.hostname}</span>
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
                  Devices inside the cluster can then select one or more of
                  these agents for wake requests.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <DialogFooter className="mb-0 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {cluster ? "Update" : "Create"} Cluster
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
