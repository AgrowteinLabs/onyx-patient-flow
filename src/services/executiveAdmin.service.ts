import { apiRequest } from "@/lib/api-request";

/* ================================
   Executive Admin Service
================================ */
export const listExecutives = async () => {
  return apiRequest("/api/view/AllExecutives", { method: "GET" });
};

export const createExecAdmin = async (payload: any) => {
  return apiRequest("/api/auth/create/exec-admin", {
    method: "POST",
    data: payload,
  });
};

export const verifyExecAdmin = async (payload: any) => {
  return apiRequest("/api/auth/create/verify-exec-admin", {
    method: "POST",
    data: payload,
  });
};

export const deleteExecAdmin = async (id: string) => {
  return apiRequest(`/update/user/${id}`, {
    method: "PUT",
    data: { status: "Inactive" },
  });
};

export const updateExecAdmin = async (id: string, payload: any) => {
  return apiRequest(`/update/user/${id}`, {
    method: "PUT",
    data: payload,
  });
};
