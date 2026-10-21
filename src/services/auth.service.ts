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
  localStorage.removeItem("apiBaseUrl");
  clearAuthToken();
};

export interface ConsumeHandshakeResponse {
  status: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  payload?: {
    reportId?: string;
    profileId?: string;
    doctorId?: string;
    bookingId?: string;
    targetRoute?: string;
  };
  error?: string;
}

export const consumeHandshakeTicket = async (ticket: string, envHint?: string | null): Promise<ConsumeHandshakeResponse> => {
  const defaultBase = import.meta.env.VITE_BACKEND_URL || "https://api.onyxhealthplus.com";

  let primaryUrl = defaultBase;
  if (envHint === "dev") {
    primaryUrl = "https://dev-api.onyxhealthplus.com";
  } else if (envHint === "prod") {
    primaryUrl = "https://api.onyxhealthplus.com";
  }

  const isDev = primaryUrl.includes("dev-api");
  const alternateUrl = isDev ? "https://api.onyxhealthplus.com" : "https://dev-api.onyxhealthplus.com";

  try {
    const res = await apiRequest<ConsumeHandshakeResponse>(API_ENDPOINTS.AUTH.CONSUME_HANDSHAKE, {
      method: "POST",
      data: { ticket },
      requiresAuth: false,
      withCredentials: true,
      baseURL: primaryUrl,
    });
    localStorage.setItem("apiBaseUrl", primaryUrl);
    return res;
  } catch (primaryErr: any) {
    const msg = (primaryErr?.message || "").toLowerCase();
    // If ticket was invalid/expired on primary backend, try alternate backend in case of dev/prod mismatch
    if (msg.includes("invalid") || msg.includes("expired") || msg.includes("401") || msg.includes("not found")) {
      try {
        console.warn(`Ticket not found on ${primaryUrl}, checking alternate backend ${alternateUrl}...`);
        const altRes = await apiRequest<ConsumeHandshakeResponse>(API_ENDPOINTS.AUTH.CONSUME_HANDSHAKE, {
          method: "POST",
          data: { ticket },
          requiresAuth: false,
          withCredentials: true,
          baseURL: alternateUrl,
        });
        localStorage.setItem("apiBaseUrl", alternateUrl);
        return altRes;
      } catch {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
};
