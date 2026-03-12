/**
 * Global auth state store using Zustand
 */
import { create } from "zustand";
import { authApi } from "@/api/auth";
import { setupApi } from "@/api/setup";
import { configApi } from "@/api/config";
import type { Permission, User } from "@/types";
import rolePermissions from "./permissions";

interface AuthState {
  isSetupComplete: boolean | null;
  oidcEnabled: boolean;
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;

  checkSetup: () => Promise<void>;
  loadAuthConfig: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  setAuthenticated: (authenticated: boolean, user?: User) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  reset: () => void;
  hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  isSetupComplete: null,
  oidcEnabled: false,
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,

  checkSetup: async () => {
    try {
      const response = await setupApi.getStatus();
      set({ isSetupComplete: response.data.is_setup_complete });
    } catch (error) {
      console.error("Failed to check setup status:", error);
      set({ isSetupComplete: false });
    }
  },

  loadAuthConfig: async () => {
    try {
      const response = await configApi.getOIDC();
      set({ oidcEnabled: response.data.enabled });
    } catch (error) {
      console.error("Failed to load auth config:", error);
      set({ oidcEnabled: false });
    }
  },

  loadCurrentUser: async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      set({ isAuthenticated: false, user: null, loading: false });
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      set({ isAuthenticated: true, user: response.data, loading: false });
    } catch (error) {
      console.log("🚀 ~ error:", error);
      // Token is invalid, clear it
      localStorage.removeItem("access_token");
      set({ isAuthenticated: false, user: null, loading: false });
    }
  },

  setAuthenticated: (authenticated, user) => {
    set({ isAuthenticated: authenticated, user });
  },

  setError: (error) => {
    set({ error });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    set({ isAuthenticated: false, user: null });
  },

  reset: () => {
    set({
      isSetupComplete: null,
      oidcEnabled: false,
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
  },

  hasPermission: (permission: Permission): boolean => {
    const { user } = useAuthStore.getState();
    if (!user) return false;

    return rolePermissions[user.role]?.includes(permission) || false;
  },
}));
