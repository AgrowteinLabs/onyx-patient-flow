import axios from "axios";
import { API_BASE_URL } from "@/lib/api-config";
import { getAuthToken } from "@/lib/api-request";

const abdmAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

abdmAxios.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["ngrok-skip-browser-warning"] = "true";
  return config;
});

export interface AbdmError {
  httpStatus: number;
  code: string | null;
  error: string;
}

export interface RequestOtpResult {
  txnId: string;
  channel?: "aadhaar" | "mobile";
}

export interface CreateVerifyResult {
  abhaNumber: string;
  abhaAddress: string;
  abhaStatus: "LINKED" | "DEACTIVATED" | "NONE";
  alreadyExisted: boolean;
}

export interface ConnectVerifyResult {
  abhaNumber?: string;
  abhaAddress?: string;
  abhaStatus?: "LINKED" | "DEACTIVATED" | "NONE";
  requiresSelection?: boolean;
  txnId?: string;
  accounts?: Array<{
    abhaNumber: string;
    name: string;
    abhaStatus: "ACTIVE" | "DEACTIVATED";
  }>;
}

export interface ConnectSelectResult {
  abhaNumber: string;
  abhaAddress: string;
  abhaStatus: "LINKED";
}

export interface CardVerifyResult {
  cardPng: string; // base64 string
  abhaStatus: "LINKED" | "DEACTIVATED";
  abhaAddress: string;
}

export interface UnlinkResult {
  abhaStatus: "NONE";
}

async function handleRequest<T>(requestPromise: Promise<any>): Promise<T> {
  try {
    const response = await requestPromise;
    const body = response.data;
    
    // In postman collection, success shape is: { status: "success", data: ... }
    if (body && body.status === "fail") {
      throw {
        httpStatus: response.status || 400,
        code: body.code || null,
        error: body.error || "Request failed",
      };
    }
    
    return (body && body.data) !== undefined ? body.data : body;
  } catch (err: any) {
    if (err.httpStatus) {
      throw err;
    }
    if (axios.isAxiosError(err)) {
      const response = err.response;
      const status = response?.status || 500;
      const responseData = response?.data;
      
      throw {
        httpStatus: status,
        code: responseData?.code || null,
        error: responseData?.error || responseData?.message || err.message || "Network or server error",
      };
    }
    throw {
      httpStatus: 500,
      code: null,
      error: err.message || "An unexpected error occurred",
    };
  }
}

export const createRequestOtp = async (
  profileId: string,
  aadhaar: string
): Promise<RequestOtpResult> => {
  return handleRequest<RequestOtpResult>(
    abdmAxios.post(`/api/abdm/${profileId}/create/request-otp`, { aadhaar })
  );
};

export const createVerify = async (
  profileId: string,
  txnId: string,
  otp: string,
  mobile: string
): Promise<CreateVerifyResult> => {
  return handleRequest<CreateVerifyResult>(
    abdmAxios.post(`/api/abdm/${profileId}/create/verify`, { txnId, otp, mobile })
  );
};

export const connectRequestOtp = async (
  profileId: string,
  identifierType: "abha-number" | "aadhaar" | "mobile",
  identifier: string
): Promise<RequestOtpResult> => {
  return handleRequest<RequestOtpResult>(
    abdmAxios.post(`/api/abdm/${profileId}/connect/request-otp`, {
      identifierType,
      identifier,
    })
  );
};

export const connectVerify = async (
  profileId: string,
  txnId: string,
  otp: string
): Promise<ConnectVerifyResult> => {
  return handleRequest<ConnectVerifyResult>(
    abdmAxios.post(`/api/abdm/${profileId}/connect/verify`, { txnId, otp })
  );
};

export const connectSelect = async (
  profileId: string,
  txnId: string,
  abhaNumber: string
): Promise<ConnectSelectResult> => {
  return handleRequest<ConnectSelectResult>(
    abdmAxios.post(`/api/abdm/${profileId}/connect/select`, { txnId, abhaNumber })
  );
};

export const cardRequestOtp = async (
  profileId: string
): Promise<RequestOtpResult> => {
  return handleRequest<RequestOtpResult>(
    abdmAxios.post(`/api/abdm/${profileId}/card/request-otp`, {})
  );
};

export const cardVerify = async (
  profileId: string,
  txnId: string,
  otp: string
): Promise<CardVerifyResult> => {
  return handleRequest<CardVerifyResult>(
    abdmAxios.post(`/api/abdm/${profileId}/card/verify`, { txnId, otp })
  );
};

export const unlinkAbha = async (
  profileId: string
): Promise<UnlinkResult> => {
  return handleRequest<UnlinkResult>(
    abdmAxios.delete(`/api/abdm/${profileId}/link`)
  );
};
