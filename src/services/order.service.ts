import { apiRequest } from "@/lib/api-request";
import { API_ENDPOINTS } from "@/lib/api-config";

export const createOrder = async (sessionId: string, receipt: string): Promise<any> => {
  return apiRequest(API_ENDPOINTS.ORDER.CREATE, {
    method: "POST",
    data: { sessionId, receipt },
  });
};

export const listOrders = async (sessionId?: string): Promise<any> => {
  const params = sessionId ? { sessionId } : {};
  return apiRequest(API_ENDPOINTS.ORDER.LIST, {
    method: 'GET',
    params,
  });
};
