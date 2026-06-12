import axios from "axios";
import { apiRequest, getAuthToken } from "@/lib/api-request";
import { API_BASE_URL } from "@/lib/api-config";

export interface TestsPerDeviceItem {
  deviceId: string;
  count: number;
  deviceName: string;
  price: number;
  subtotal: number;
}

export interface MachineAnalyticsSummary {
  machineNickName: string;
  machineId: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  userCount: number;
  testCount: number;
  testsPerDevice: TestsPerDeviceItem[];
}

export interface QueryParams {
  startDate?: string;
  endDate?: string;
}

// Format date helper from standard YYYY-MM-DD to dd-mm-yyyy for backend compatibility
const formatDateParam = (dateStr?: string): string | undefined => {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    // YYYY-MM-DD to DD-MM-YYYY
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export const getMachineAnalytics = async (
  productId: string,
  params: QueryParams = {}
): Promise<MachineAnalyticsSummary> => {
  const queryParams = new URLSearchParams();
  const formattedStart = formatDateParam(params.startDate);
  const formattedEnd = formatDateParam(params.endDate);

  if (formattedStart) queryParams.append("startDate", formattedStart);
  if (formattedEnd) queryParams.append("endDate", formattedEnd);

  const queryString = queryParams.toString();
  const url = `/api/machine-analytics/${productId}` + (queryString ? `?${queryString}` : "");
  return apiRequest(url, { method: "GET" });
};

export const exportMachineSummary = async (
  productId: string,
  format: "xlsx" | "pdf",
  params: QueryParams = {}
) => {
  const queryParams = new URLSearchParams();
  queryParams.append("format", format);
  
  const formattedStart = formatDateParam(params.startDate);
  const formattedEnd = formatDateParam(params.endDate);

  if (formattedStart) queryParams.append("startDate", formattedStart);
  if (formattedEnd) queryParams.append("endDate", formattedEnd);

  const url = `/api/machine-analytics/${productId}/export?${queryParams.toString()}`;
  return downloadFile(url, `analytics_${productId}.${format}`);
};

export const exportBulkRawData = async (
  productId: string,
  format: "xlsx" | "pdf",
  params: QueryParams = {}
) => {
  const queryParams = new URLSearchParams();
  queryParams.append("format", format);

  const formattedStart = formatDateParam(params.startDate);
  const formattedEnd = formatDateParam(params.endDate);

  if (formattedStart) queryParams.append("startDate", formattedStart);
  if (formattedEnd) queryParams.append("endDate", formattedEnd);

  const url = `/api/machine-analytics/${productId}/bulk-export?${queryParams.toString()}`;
  return downloadFile(url, `bulk_analytics_${productId}.${format}`);
};

// Helper to download authenticated files as blobs
const downloadFile = async (url: string, filename: string) => {
  const token = getAuthToken();
  const response = await axios.get(`${API_BASE_URL}${url}`, {
    headers: {
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: response.headers["content-type"] });
  const downloadUrl = globalThis.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL(downloadUrl);
};
