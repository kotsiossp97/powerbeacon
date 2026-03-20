/**
 * Configuration API endpoints
 */
import apiClient from './client'
import type { AppMetadata, OIDCConfig, OIDCConfigPublic } from '@/types'

export const configApi = {
  getOIDC: () =>
    apiClient.get<OIDCConfigPublic>('/api/config/oidc'),

  getAbout: () =>
    apiClient.get<AppMetadata>('/api/config/about'),

  updateOIDC: (config: OIDCConfig) =>
    apiClient.put('/api/config/oidc', config),
}
