import { apiRequest } from "@/lib/api-request";

export const listNurses = async () => {
  const res = await apiRequest("/api/view/AllNurses", { method: "GET" });
  return res.nurses || res.data || [];
};

export const createNurse = async (payload: any) => {
  return apiRequest("/api/auth/create/nurse", {
    method: "POST",
    data: payload,
  });
};

export const deleteNurse = async (id: string) => {
  return apiRequest("/api/inactive/all/entity/toggle-status", {
    method: "POST",
    data: {
      targetId: id,
      targetType: "user",
      status: "Inactive",
    },
  });
};

export const toggleNurseStatus = async (id: string, status: string) => {
  return apiRequest("/api/inactive/all/entity/toggle-status", {
    method: "POST",
    data: {
      targetId: id,
      targetType: "user",
      status,
    },
  });
};

export const updateNurse = (id: string, data: any) =>
  apiRequest(`/update/user/${id}`, {
    method: "PUT",
    data
  });
