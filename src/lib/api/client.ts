/**
 * Axios API Client
 * All API calls go through this client
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_CONFIG, STORAGE_KEYS } from "@/lib/constants/config";

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }

      const language = localStorage.getItem(STORAGE_KEYS.language) || "ar";
      config.headers["Accept-Language"] = language;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
        localStorage.removeItem(STORAGE_KEYS.company);
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Helper for form data (file uploads)
export const uploadFile = async (
  url: string,
  formData: FormData,
  onProgress?: (progress: number) => void
) => {
  return apiClient.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        const progress = Math.round((event.loaded * 100) / event.total);
        onProgress(progress);
      }
    },
  });
};