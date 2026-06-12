import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL } from "./api-config";

interface ApiRequestConfig extends AxiosRequestConfig {
  requiresAuth?: boolean;
}

axios.defaults.withCredentials = true;

/* =========================================================
   🔐 TOKEN HELPERS
   ========================================================= */
export const getAuthToken = (): string | null => localStorage.getItem("authToken");
export const getRefreshToken = (): string | null => localStorage.getItem("refreshToken");

export const setAuthToken = (token: string): void => localStorage.setItem("authToken", token);
export const setRefreshToken = (token: string): void => localStorage.setItem("refreshToken", token);

export const clearAuthToken = (): void => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
};

/* =========================================================
   🔁 REFRESH TOKEN HANDLING  (uses /api/auth/issue-token)
   ========================================================= */
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const refreshAuthToken = async (): Promise<string> => {
  const accessToken = getAuthToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) throw new Error("Missing tokens");

  if (isRefreshing) {
    return new Promise((resolve) => subscribeTokenRefresh(resolve));
  }

  isRefreshing = true;
  try {
    console.log("🔁 Requesting new access token from /api/auth/issue-token…");

    const response = await axios.get(`${API_BASE_URL}/api/auth/issue-token`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Refresh-Token": `Bearer ${refreshToken}`,
        "ngrok-skip-browser-warning": "true", // 👈 skip ngrok warning page
      },
      withCredentials: true,
    });

    const newToken = response.data?.token || response.data?.accessToken;
    const newRefresh = response.data?.refreshToken || refreshToken;

    if (!newToken) throw new Error("No token returned by /issue-token");

    setAuthToken(newToken);
    setRefreshToken(newRefresh);

    onRefreshed(newToken);
    console.log("✅ Token refreshed successfully");
    return newToken;
  } catch (err) {
    console.error("❌ Failed to refresh token:", err);
    clearAuthToken();
    window.location.href = "/login";
    throw err;
  } finally {
    isRefreshing = false;
  }
};

/* =========================================================
   🌐 MAIN REQUEST HANDLER
   ========================================================= */
export const apiRequest = async <T = any>(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<T> => {
  const { requiresAuth = true, headers = {}, ...restConfig } = config;
  const token = getAuthToken();

  const requestConfig: AxiosRequestConfig = {
    baseURL: API_BASE_URL,
    url: endpoint,
    method: restConfig.method || "GET",
    data: restConfig.data || {},
    params: restConfig.params || {},
    timeout: 15000,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true", // 👈 critical for all requests
      ...(requiresAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  /* ----------------------- 🧭 LOG OUTGOING ----------------------- */
  console.groupCollapsed(
    `%c🌍 [API REQUEST] ${requestConfig.method?.toUpperCase()} ${API_BASE_URL}${endpoint}`,
    "color:#0070f3;font-weight:bold;"
  );
  console.log("Headers:", requestConfig.headers);
  console.log("Data:", requestConfig.data);
  console.groupEnd();

  try {
    const response: AxiosResponse<T> = await axios(requestConfig);

    /* ----------------------- ✅ LOG SUCCESS ----------------------- */
    console.groupCollapsed(
      `%c✅ [API RESPONSE] ${requestConfig.method?.toUpperCase()} ${endpoint}`,
      "color:green;font-weight:bold;"
    );
    console.log("Status:", response.status);
    console.log("Data:", response.data);
    console.groupEnd();

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      console.groupCollapsed(
        `%c❌ [API ERROR] ${requestConfig.method?.toUpperCase()} ${endpoint}`,
        "color:red;font-weight:bold;"
      );
      console.log("Status:", status);
      console.log("Message:", message);
      console.groupEnd();

      /* 401 Handling → refresh token flow */
      if (status === 401 && requiresAuth) {
        try {
          const newToken = await refreshAuthToken();

          // Retry original request with new token
          requestConfig.headers = {
            ...requestConfig.headers,
            Authorization: `Bearer ${newToken}`,
          };
          console.log("🔄 Retrying request with new access token…");
          const retryResponse: AxiosResponse<T> = await axios(requestConfig);
          return retryResponse.data;
        } catch {
          throw new Error("Session expired. Please log in again.");
        }
      }

      if (error.code === "ERR_NETWORK") {
        console.error("🌐 Network Error — likely CORS or invalid URL.");
        throw new Error("Network error. Please check server connection.");
      }

      throw new Error(message);
    }

    console.error("💥 Unexpected error:", error);
    throw error;
  }
};
