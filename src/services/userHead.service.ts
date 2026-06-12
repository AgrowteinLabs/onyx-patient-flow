import { apiRequest } from "@/lib/api-request";

export const listUserHeads = () => apiRequest("/api/view/AllUserHeads");

export const createUserHead = (data: any) =>
  apiRequest("/api/auth/create/user-head", {
    method: "POST",
    data,
  });

export const verifyUserHead = (data: { otp: string }) =>
  apiRequest("/api/auth/create/verify-user-head", {
    method: "POST",
    data,
  });

export const deleteUserHead = (id: string) =>
  apiRequest("/api/inactive/all/entity/toggle-status", {
    method: "POST",
    data: {
      targetId: id,
      targetType: "user",
      status: "Inactive",
    },
  });

export const toggleUserHeadStatus = (id: string, status: string) =>
  apiRequest("/api/inactive/all/entity/toggle-status", {
    method: "POST",
    data: {
      targetId: id,
      targetType: "user",
      status,
    },
  });

export const updateUserHead = (id: string, data: any) =>
  apiRequest(`/update/user/${id}`, {
    method: "PUT",
    data,
  });
