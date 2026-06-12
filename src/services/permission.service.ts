import { apiRequest } from "@/lib/api-request";

export const listPermissions = async () => {
  return apiRequest("/api/view/permissions", { method: "GET" });
};

export const getPermissions = () =>
  apiRequest("/api/view/permissions", { method: "GET" });

export const getUserPermissions = async (userId: string) => {
  const res = await apiRequest(`/api/view/userPermissions/${userId}`, {
    method: "GET",
  });
  return res.permissions || res.data || [];
};