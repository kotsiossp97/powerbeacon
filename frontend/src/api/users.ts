/**
 * Users API endpoints
 */
import apiClient from "./client";
import type {
  User,
  UserCreate,
  UserUpdate,
  UserUpdateMe,
  UserUpdatePassword,
  UsersPublic,
} from "@/types";

export const usersApi = {
  list: (skip = 0, limit = 100) =>
    apiClient.get<UsersPublic>("/api/users", { params: { skip, limit } }),

  get: (userId: string) => apiClient.get<User>(`/api/users/${userId}`),

  create: (data: UserCreate) => apiClient.post<User>("/api/users", data),

  update: (userId: string, data: UserUpdate) =>
    apiClient.patch<User>(`/api/users/${userId}`, data),

  updateMe: (data: UserUpdateMe) =>
    apiClient.patch<User>("/api/users/me", data),

  updatePassword: (data: UserUpdatePassword) =>
    apiClient.patch<User>("/api/users/me/password", data),

  delete: (userId: string) => apiClient.delete(`/api/users/${userId}`),
};
