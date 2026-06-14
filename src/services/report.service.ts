import { apiRequest } from "@/lib/api-request";
import { API_ENDPOINTS } from "@/lib/api-config";

export const listReportsBySession = async (id: string) => {
  const res: any = await apiRequest(API_ENDPOINTS.REPORT.BY_SESSION(id), { method: "GET" });
  return res?.reports || [];
};

export const listReportsByUser = async (id: string) => {
  const res: any = await apiRequest(API_ENDPOINTS.REPORT.BY_USER(id), { method: "GET" });
  return res?.reports || [];
};

export const listReportsByProfile = async (id: string) => {
  const res: any = await apiRequest(API_ENDPOINTS.REPORT.BY_PROFILE(id), { method: "GET" });
  return res?.reports || [];
};
