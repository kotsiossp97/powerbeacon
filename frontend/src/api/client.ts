/**
 * API client for backend communication
 */
import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || window.location.origin;

interface ApiClientConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    });
    console.log("🚀 ~ ApiClient ~ constructor ~ baseURL:", config.baseURL);

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Don't redirect if this is a login request failing (bad credentials)
          // The login component will handle the error
          const isLoginRequest = error.config?.url?.includes("/auth/login");
          console.log(
            "🚀 ~ ApiClient ~ constructor ~ isLoginRequest:",
            isLoginRequest,
          );
          if (!isLoginRequest) {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get = <T = any>(url: string, config?: AxiosRequestConfig) =>
    this.client.get<T>(url, config);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    this.client.post<T>(url, data, config);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    this.client.put<T>(url, data, config);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    this.client.patch<T>(url, data, config);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete = <T = any>(url: string, config?: AxiosRequestConfig) =>
    this.client.delete<T>(url, config);
}

export const apiClient = new ApiClient({ baseURL: API_BASE_URL });
export default apiClient;
