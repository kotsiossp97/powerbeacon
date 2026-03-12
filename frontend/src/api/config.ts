/**
 * Configuration API endpoints
 */
import apiClient from './client'
import type { OIDCConfig, OIDCConfigPublic } from '@/types'

export const configApi = {
  getOIDC: () =>
    apiClient.get<OIDCConfigPublic>('/api/config/oidc'),

  updateOIDC: (config: OIDCConfig) =>
    apiClient.put('/api/config/oidc', config),
}
