/**
 * Agent card component
 */
import { type Agent } from "@/types";
import { agentsApi } from "@/api/agents";
import { useState } from "react";

interface AgentCardProps {
  agent: Agent;
  onRefresh?: () => void;
}

export const AgentCard = ({ agent, onRefresh }: AgentCardProps) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await agentsApi.delete(agent.id);
      onRefresh?.();
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Failed to delete agent");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800";
      case "offline":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOSIcon = (os: string) => {
    switch (os.toLowerCase()) {
      case "linux":
        return "🐧";
      case "windows":
        return "🪟";
      case "darwin":
        return "🍎";
      default:
        return "💻";
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getOSIcon(agent.os)}</span>
            <h3 className="text-lg font-bold text-gray-900">
              {agent.hostname}
            </h3>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(agent.status)}`}
            >
              {agent.status}
            </span>
          </div>
          <p className="text-sm text-gray-600">IP: {agent.ip}</p>
          <p className="text-sm text-gray-600">Version: {agent.version}</p>
          <p className="text-sm text-gray-600">
            Last seen: {formatLastSeen(agent.last_seen)}
          </p>
        </div>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
          className="btn btn-secondary text-sm px-3 py-1"
        >
          Remove
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-gray-700 mb-3">
            Are you sure you want to remove this agent? This will not uninstall
            the agent from the host.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="btn btn-danger text-sm px-3 py-1"
            >
              {loading ? "Removing..." : "Confirm Remove"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
              className="btn btn-secondary text-sm px-3 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          ID: {agent.id.substring(0, 8)}...
        </p>
        <p className="text-xs text-gray-500">
          Registered:{" "}
          {new Date(agent.created_at).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>
    </div>
  );
};
