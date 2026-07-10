/**
 * Configuration API endpoints
 */
import apiClient from "./client";
import type {
  AppMetadata,
  OIDCConfig,
  OIDCConfigPublic,
  ServiceConfig,
} from "@/types";

export const configApi = {
  getOIDC: () => apiClient.get<OIDCConfigPublic>("/api/config/oidc"),

  getAbout: () => apiClient.get<AppMetadata>("/api/config/about"),

  updateOIDC: (config: OIDCConfig) => apiClient.put("/api/config/oidc", config),

  getAllServiceConfigs: () =>
    apiClient.get<ServiceConfig[]>("/api/config/services"),

  getServiceConfig: (serviceName: string) =>
    apiClient.get<ServiceConfig>(`/api/config/services/${serviceName}`),

  updateServiceConfig: (config: ServiceConfig) =>
    apiClient.put(`/api/config/services`, config),
};
