/**
 * Device API endpoints
 */
import apiClient from './client'
import { type DeviceCreate, type DeviceUpdate } from '@/types'

export const deviceApi = {
  list: (skip = 0, limit = 100) =>
    apiClient.get('/api/devices', { params: { skip, limit } }),

  get: (id: string) =>
    apiClient.get(`/api/devices/${id}`),

  create: (device: DeviceCreate) =>
    apiClient.post('/api/devices', device),

  update: (id: string, device: DeviceUpdate) =>
    apiClient.put(`/api/devices/${id}`, device),

  delete: (id: string) =>
    apiClient.delete(`/api/devices/${id}`),

  wake: (id: string) =>
    apiClient.post(`/api/devices/${id}/wake`),
}
