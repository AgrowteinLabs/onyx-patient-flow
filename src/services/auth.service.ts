import { apiRequest, setAuthToken, clearAuthToken } from "@/lib/api-request";
import { API_ENDPOINTS } from "@/lib/api-config";
import { UserRole } from "@/types/roles";

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  message?: string;
}

export interface VerifyResponse extends AuthResponse {
  role?: UserRole;
}

// Step 1: Send OTP
export const userAuth = async (phone_number: string[]): Promise<AuthResponse> => {
  return apiRequest(API_ENDPOINTS.AUTH.USER_AUTH, {
    method: "POST",
    data: {
      phone_number,
      country: "India",
      product_id: null,
    },
    requiresAuth: false,
    withCredentials: true,
  });
};

// Step 2: Verify OTP
export const userAuthVerify = async ({
  otp,
}: {
  otp: string;
}): Promise<VerifyResponse> => {
  const response = await apiRequest<VerifyResponse>(
    API_ENDPOINTS.AUTH.USER_AUTH_VERIFY,
    {
      method: "POST",
      data: { otp },
      requiresAuth: false,
      withCredentials: true,
    }
  );

  if (response.accessToken) setAuthToken(response.accessToken);
  return response;
};

// Step 1: Send OTP for Non-User (Admin, Doctor, etc.)
export const signinNonUser = async (phone_number: string[]): Promise<AuthResponse> => {
  return apiRequest(API_ENDPOINTS.AUTH.SIGNIN_NON_USER, {
    method: "POST",
    data: { phone_number },
    requiresAuth: false,
    withCredentials: true,
  });
};

// Password Reset - Step 1: Request OTP
export const requestPasswordResetOtp = async (phone_number: string[]): Promise<AuthResponse> => {
  return apiRequest(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
    method: "POST",
    data: { phone_number },
    requiresAuth: false,
  });
};

// Password Reset - Step 2: Reset Password
export const resetPassword = async ({
  phone_number,
  otp,
  new_password,
}: {
  phone_number: string[];
  otp: string;
  new_password?: string;
}): Promise<AuthResponse> => {
  return apiRequest(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
    method: "POST",
    data: { phone_number, otp, new_password },
    requiresAuth: false,
  });
};

// Step 2: Verify OTP + Password for Non-User
export const verifyNonUser = async ({
  otp,
  password,
}: {
  otp: string;
  password?: string;
}): Promise<VerifyResponse> => {
  const response = await apiRequest<VerifyResponse>(
    API_ENDPOINTS.AUTH.VERIFY_NON_USER,
    {
      method: "POST",
      data: { otp, password },
      requiresAuth: false,
      withCredentials: true,
    }
  );

  if (response.accessToken) setAuthToken(response.accessToken);
  return response;
};

// Logout
export const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userPhone");
  clearAuthToken();
};
