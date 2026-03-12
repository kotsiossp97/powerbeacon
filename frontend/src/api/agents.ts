/**
 * Agents API client
 */
import { apiClient } from "./client";
import type {
  Agent,
  AgentRegistration,
  AgentHeartbeat,
  AgentsPublic,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || window.location.origin;

export const agentsApi = {
  /**
   * Get all agents
   */
  async getAll(): Promise<Agent[]> {
    const response = await apiClient.get<AgentsPublic>("/api/agents");
    return response.data.agents;
  },

  /**
   * Get agent by ID
   */
  async getById(id: string): Promise<Agent> {
    const response = await apiClient.get<Agent>(`/api/agents/${id}`);
    return response.data;
  },

  /**
   * Register a new agent
   */
  async register(
    data: AgentRegistration,
  ): Promise<{ agent_id: string; token: string }> {
    const response = await apiClient.post<{ agent_id: string; token: string }>(
      "/api/agents/register",
      data,
    );
    return response.data;
  },

  /**
   * Send heartbeat
   */
  async heartbeat(data: AgentHeartbeat): Promise<void> {
    await apiClient.post("/api/agents/heartbeat", data);
  },

  /**
   * Delete agent
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/agents/${id}`);
  },

  /**
   * Check agent health (direct connection to agent)
   */
  async checkHealth(agentUrl: string = "http://localhost:18080"): Promise<{
    status: string;
    version: string;
  }> {
    try {
      const response = await fetch(`${agentUrl}/health`);
      if (!response.ok) {
        throw new Error("Agent not responding");
      }
      return await response.json();
    } catch (error) {
      console.log("🚀 ~ agentApi.checkHealth:", error)
      throw new Error("Agent not detected. Please install the agent.");
    }
  },

  /**
   * Get installation script URL
   */
  getInstallScriptUrl(platform: "linux" | "windows"): string {
    return `${API_BASE_URL}/install-agent.${platform === "linux" ? "sh" : "ps1"}`;
  },

  /**
   * Get agent binary URL
   */
  getAgentBinaryUrl(
    platform: "linux" | "windows" | "darwin",
    arch: string = "amd64",
  ): string {
    const ext = platform === "windows" ? ".exe" : "";
    return `${API_BASE_URL}/agents/${platform}-${arch}${ext}`;
  },
};
