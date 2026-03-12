import * as z from "zod";
import type { Device } from "@/types";

export const deviceFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  mac_address: z
    .string()
    .min(1, "MAC address is required")
    .regex(
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      "Invalid MAC address format",
    ),
  ip_address: z.string().optional(),
  os_type: z.enum(["linux", "windows", "macos"]),
  description: z.string().optional(),
  tags: z.string().optional(),
  agent_id: z.string().optional(),
});

export type DeviceFormData = z.infer<typeof deviceFormSchema>;

export const getDeviceFormDefaults = (
  device?: Device | null,
  defaultAgentId?: string,
): DeviceFormData => ({
  name: device?.name || "",
  mac_address: device?.mac_address || "",
  ip_address: device?.ip_address || "",
  os_type: device?.os_type || "linux",
  description: device?.description || "",
  tags: device?.tags?.join(", ") || "",
  agent_id: device?.agent_id || defaultAgentId || "",
});

export const mapDeviceFormToPayload = (data: DeviceFormData): Partial<Device> => {
  const tags = data.tags
    ? data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  return {
    ...data,
    tags,
    agent_id: data.agent_id || undefined,
  };
};
