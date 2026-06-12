import { apiRequest } from "@/lib/api-request";
import { API_ENDPOINTS } from "@/lib/api-config";

export const createTicket = async (data: any): Promise<any> => {
  return apiRequest(API_ENDPOINTS.TICKET.CREATE, {
    method: "POST",
    data,
  });
};

export const listAdminTickets = async (): Promise<any> => {
  return apiRequest(API_ENDPOINTS.TICKET.ADMIN_LIST, {
    method: 'GET',
  });
};

export const resolveTicket = async (id: string, resolution: string): Promise<any> => {
  return apiRequest(API_ENDPOINTS.TICKET.ADMIN_RESOLVE(id), {
    method: 'POST',
    data: { resolution },
  });
};
