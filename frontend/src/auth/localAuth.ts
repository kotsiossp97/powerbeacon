/**
 * Local authentication hook
 */
import { AxiosError } from "axios";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/auth/useAuth";

export const useLocalAuth = () => {
  const navigate = useNavigate();
  const { setAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (username: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authApi.login(username, password);
        const { access_token } = response.data;

        // Store token
        localStorage.setItem("access_token", access_token);

        // Fetch current user info
        const userResponse = await authApi.getCurrentUser();
        const user = userResponse.data;

        // Update Zustand store
        setAuthenticated(true, user);

        navigate("/");
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof AxiosError && typeof err.response?.data?.detail === "string"
            ? err.response.data.detail
            : "Login failed";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [navigate, setAuthenticated],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setAuthenticated(false);
    navigate("/login");
  }, [navigate, setAuthenticated]);

  return { login, logout, loading, error };
};
