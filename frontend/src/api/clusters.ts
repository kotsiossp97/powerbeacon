import { apiClient } from "./client";
import type {
  Cluster,
  ClusterCreate,
  ClusterDetail,
  ClustersPublic,
  ClusterUpdate,
} from "@/types";

export const clustersApi = {
  async list(skip = 0, limit = 100): Promise<Cluster[]> {
    const response = await apiClient.get<ClustersPublic>("/api/clusters", {
      params: { skip, limit },
    });
    return response.data.clusters;
  },

  async getById(id: string): Promise<ClusterDetail> {
    const response = await apiClient.get<ClusterDetail>(`/api/clusters/${id}`);
    return response.data;
  },

  create(cluster: ClusterCreate) {
    return apiClient.post<Cluster>("/api/clusters", cluster);
  },

  update(id: string, cluster: ClusterUpdate) {
    return apiClient.put<Cluster>(`/api/clusters/${id}`, cluster);
  },

  delete(id: string) {
    return apiClient.delete(`/api/clusters/${id}`);
  },

  wake(id: string) {
    return apiClient.post(`/api/clusters/${id}/wake`);
  },
};