import { apiRequest } from "@/lib/api-request";

export const listTechnicians = async () => {
  const res = await apiRequest("/api/view/AllTechnicians", { method: "GET" });
  return res.technicians || res.data || [];
};

// Step 1: Send OTP to technician's phone (with full data)
export const sendTechnicianOTP = async (payload: {
  phone_number: string[];
  password: string;
  name: string;
  country: string;
  permissions: string[];
}) => {
  console.log("🔐 Checking auth token:", localStorage.getItem("authToken") ? "Present" : "Missing");
  
  return apiRequest("/api/auth/create/technician", {
    method: "POST",
    data: payload,
  });
};

// Step 2: Verify OTP (only OTP needed)
export const verifyTechnicianOTP = async (payload: { otp: string }) => {
  return apiRequest("/api/auth/create/verify-technician", {
    method: "POST",
    data: payload,
  });
};

export const deleteTechnician = async (id: string) => {
  return apiRequest(`/update/user/${id}`, {
    method: "PUT",
    data: { status: "Inactive" },
  });
};

export const updateTechnician = async (id: string, payload: any) => {
  return apiRequest(`/update/user/${id}`, {
    method: "PUT",
    data: payload,
  });
};