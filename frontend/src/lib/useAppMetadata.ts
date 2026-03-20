import { create } from "zustand";
import { configApi } from "@/api/config";
import type { AppMetadata } from "@/types";

interface AppMetadataState {
  metadata: AppMetadata | null;
  loading: boolean;
  error: string | null;
  loadMetadata: (force?: boolean) => Promise<void>;
  reset: () => void;
}

export const useAppMetadataStore = create<AppMetadataState>((set, get) => ({
  metadata: null,
  loading: false,
  error: null,

  loadMetadata: async (force = false) => {
    const { loading, metadata } = get();

    if (loading) {
      return;
    }

    if (metadata && !force) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await configApi.getAbout();
      set({ metadata: response.data, loading: false, error: null });
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } };
      set({
        loading: false,
        error: apiError.response?.data?.detail || "Failed to load application metadata",
      });
    }
  },

  reset: () => {
    set({ metadata: null, loading: false, error: null });
  },
}));
