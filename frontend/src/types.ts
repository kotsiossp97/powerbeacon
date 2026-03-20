/**
 * Type definitions
 */

export interface Device {
  id: string;
  name: string;
  mac_address: string;
  ip_address?: string;
  os_type: "linux" | "macos" | "windows";
  is_active: boolean;
  description?: string;
  tags: string[];
  cluster_id?: string;
  cluster_name?: string;
  agents: DeviceAgentSummary[];
  owner_id?: string;
  owner_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceAgentSummary {
  id: string;
  hostname: string;
  ip: string;
  status: "online" | "offline";
}

export interface DeviceCreate {
  name: string;
  mac_address: string;
  ip_address?: string;
  os_type: "linux" | "macos" | "windows";
  description?: string;
  tags?: string[];
  cluster_id?: string;
  agent_ids?: string[];
}

export interface DeviceUpdate {
  name?: string;
  mac_address?: string;
  ip_address?: string;
  os_type?: "linux" | "macos" | "windows";
  description?: string;
  tags?: string[];
  cluster_id?: string;
  agent_ids?: string[];
}

export type UserRole = "superuser" | "admin" | "user" | "viewer";

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export type Permission =
  | "manage_users"
  | "manage_devices"
  | "manage_agents"
  | "wake_device"
  | "view_devices"
  | "view_users"
  | "view_agents"
  | "manage_settings";

export interface UserCreate {
  username: string;
  email?: string;
  password: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  password?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UsersPublic {
  data: User[];
  count: number;
}

export interface OIDCConfig {
  enabled: boolean;
  server_metadata_url?: string;
  client_id?: string;
  client_secret?: string;
}

export interface OIDCConfigPublic {
  enabled: boolean;
  server_metadata_url?: string;
  client_id?: string;
}

export interface Contributor {
  login?: string;
  avatar_url?: string;
  html_url?: string;
  contributions: number;
}

export interface AppMetadata {
  current_version: string;
  latest_version?: string;
  update_available: boolean;
  release_url: string;
  repo_url: string;
  checked_at: string;
  contributors: Contributor[];
}

export interface SetupStatus {
  is_setup_complete: boolean;
  user_count: number;
}

export interface SetupInitializeRequest {
  username: string;
  email?: string;
  password: string;
  full_name?: string;
  oidc?: OIDCConfig;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Agent {
  id: string;
  hostname: string;
  ip: string;
  port: number;
  os: "linux" | "windows" | "darwin";
  version: string;
  status: "online" | "offline";
  last_seen: string;
  created_at: string;
  owner_id?: string;
  owner_name?: string;
  cluster_id?: string;
  cluster_name?: string;
  device_count: number;
}

export interface AgentRegistration {
  hostname: string;
  ip: string;
  os: string;
  version: string;
}

export interface AgentHeartbeat {
  agent_id: string;
}

export interface AgentsPublic {
  agents: Agent[];
  count: number;
}

export interface Cluster {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  owner_id?: string;
  owner_name?: string;
  device_count: number;
  agent_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClusterDetail extends Cluster {
  devices: Device[];
  agents: Agent[];
}

export interface ClusterCreate {
  name: string;
  description?: string;
  tags?: string[];
  device_ids?: string[];
  agent_ids?: string[];
}

export interface ClusterUpdate {
  name?: string;
  description?: string;
  tags?: string[];
  device_ids?: string[];
  agent_ids?: string[];
}

export interface ClustersPublic {
  clusters: Cluster[];
  count: number;
}
