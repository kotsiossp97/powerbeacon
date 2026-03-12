/**
 * Device form dialog component
 */
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Agent, type Device } from "@/types";
import {
  deviceFormSchema,
  getDeviceFormDefaults,
  mapDeviceFormToPayload,
} from "@/components/devices/deviceForm";
import type { DeviceFormData } from "@/components/devices/deviceForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";

interface DeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: Device | null;
  agents: Agent[];
  onSubmit: (data: Partial<Device>) => void;
}

export const DeviceFormDialog = ({
  open,
  onOpenChange,
  device,
  agents,
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
      const defaultAgentId = !device && agents.length > 0 ? agents[0].id : undefined;
      form.reset(getDeviceFormDefaults(device, defaultAgentId));
    }
  }, [open, device, agents, form]);

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
                  value={form.watch("os_type")}
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
              <FieldLabel>Agent</FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch("agent_id") || ""}
                  onValueChange={(value) =>
                    form.setValue("agent_id", value === "__none__" ? "" : value)
                  }
                  disabled={agents.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        agents.length === 0 ? "No agents available" : "Select agent"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No agent assigned</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              agent.status === "online"
                                ? "bg-green-500"
                                : "bg-muted-foreground"
                            }`}
                          />
                          {agent.hostname}
                          <span className="text-muted-foreground text-xs">
                            ({agent.ip})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              <FieldDescription>
                The agent that will send Wake-on-LAN packets for this device.
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
