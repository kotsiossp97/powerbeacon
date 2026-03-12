/**
 * Setup API endpoints
 */
import apiClient from './client'
import type { SetupStatus, User, UserCreate } from '@/types'

export const setupApi = {
  getStatus: () =>
    apiClient.get<SetupStatus>('/api/setup/status'),

  initialize: (data: UserCreate) =>
    apiClient.post<User>('/api/setup/init', data),
}
