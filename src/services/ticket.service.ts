import { apiRequest } from "@/lib/api-request";
import { API_ENDPOINTS } from "@/lib/api-config";

export interface Ticket {
  _id: string;
  id?: string;
  category: string;
  description: string;
  status: string;
  resolution?: string;
  createdAt: string;
  [key: string]: any;
}

export const createTicket = async (data: { bookingId: string; issueType: string; description: string }): Promise<any> => {
  return apiRequest(API_ENDPOINTS.TICKET.CREATE, {
    method: "POST",
    data,
  });
};

export const listAdminTickets = async (): Promise<Ticket[]> => {
  const res: any = await apiRequest(API_ENDPOINTS.TICKET.ADMIN_LIST, {
    method: 'GET',
  });
  return res.tickets || res.data || (Array.isArray(res) ? res : []);
};
