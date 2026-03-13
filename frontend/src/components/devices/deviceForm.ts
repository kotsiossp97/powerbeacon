import * as z from "zod";
import type { Device, DeviceCreate, DeviceUpdate } from "@/types";

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
  cluster_id: z.string().optional(),
  agent_ids: z.array(z.string()),
});

export type DeviceFormData = z.infer<typeof deviceFormSchema>;

export const getDeviceFormDefaults = (
  device?: Device | null,
): DeviceFormData => ({
  name: device?.name || "",
  mac_address: device?.mac_address || "",
  ip_address: device?.ip_address || "",
  os_type: device?.os_type || "linux",
  description: device?.description || "",
  tags: device?.tags?.join(", ") || "",
  cluster_id: device?.cluster_id || "",
  agent_ids: device?.agents?.map((agent) => agent.id) || [],
});

export const mapDeviceFormToPayload = (
  data: DeviceFormData,
): DeviceCreate | DeviceUpdate => {
  const tags = data.tags
    ? data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  return {
    name: data.name,
    mac_address: data.mac_address,
    ip_address: data.ip_address || undefined,
    os_type: data.os_type,
    description: data.description || undefined,
    tags,
    cluster_id: data.cluster_id || undefined,
    agent_ids: data.agent_ids,
  };
};
