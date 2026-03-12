/**
 * Authentication API endpoints
 */
import apiClient from './client'
import { API_BASE_URL } from './client'
import type { Token, User } from '@/types'

export const authApi = {
  login: (username: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    
    return apiClient.post<Token>('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  },

  getCurrentUser: () =>
    apiClient.get<User>('/api/auth/me'),

  loginOIDC: () =>
    window.location.href = `${API_BASE_URL}/api/auth/login/oauth`,
}
