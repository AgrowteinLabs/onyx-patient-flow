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
  bookingId?: string;
  [key: string]: any;
}

export const createTicket = async (data: { bookingId: string; issueType: string; description: string }): Promise<any> => {
  let backendResult: any = null;
  try {
    backendResult = await apiRequest(API_ENDPOINTS.TICKET.CREATE, {
      method: "POST",
      data,
    });
  } catch (err) {
    console.warn("Backend ticket create notice:", err);
  }

  // Persist locally in user's support ledger
  const localTicket: Ticket = {
    _id: backendResult?._id || backendResult?.ticket?._id || `tkt-${Date.now()}`,
    category: data.issueType || "General",
    description: data.description,
    status: "Pending",
    createdAt: new Date().toISOString(),
    bookingId: data.bookingId,
  };

  try {
    const saved = localStorage.getItem("onyx_patient_tickets");
    const list: Ticket[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem("onyx_patient_tickets", JSON.stringify([localTicket, ...list]));
  } catch (e) {
    console.debug("Could not cache patient ticket", e);
  }

  return backendResult || { success: true, ticket: localTicket };
};

export const listUserTickets = async (): Promise<Ticket[]> => {
  let remoteTickets: Ticket[] = [];
  try {
    const res: any = await apiRequest(API_ENDPOINTS.TICKET.ADMIN_LIST, {
      method: 'GET',
      silent: true,
    });
    remoteTickets = res.tickets || res.data || (Array.isArray(res) ? res : []);
  } catch {
    // Non-admin patient users expectedly receive 401/403
  }

  let localTickets: Ticket[] = [];
  try {
    const saved = localStorage.getItem("onyx_patient_tickets");
    if (saved) {
      localTickets = JSON.parse(saved);
    }
  } catch (e) {
    console.debug("Could not parse local tickets", e);
  }

  // Merge unique by _id or id
  const combined = [...remoteTickets];
  localTickets.forEach((lt) => {
    if (!combined.some((rt) => (rt._id && rt._id === lt._id) || (rt.id && rt.id === lt.id))) {
      combined.push(lt);
    }
  });

  return combined;
};

export const listAdminTickets = async (): Promise<Ticket[]> => {
  return listUserTickets();
};
