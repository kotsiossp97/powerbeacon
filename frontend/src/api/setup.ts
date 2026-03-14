/**
 * Setup API endpoints
 */
import apiClient from './client'
import type { SetupInitializeRequest, SetupStatus, User } from '@/types'

export const setupApi = {
  getStatus: () =>
    apiClient.get<SetupStatus>('/api/setup/status'),

  initialize: (data: SetupInitializeRequest) =>
    apiClient.post<User>('/api/setup/init', data),
}
