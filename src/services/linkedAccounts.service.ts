import { apiRequest } from "@/lib/api-request";
import { API_ENDPOINTS } from "@/lib/api-config";

export interface LinkedAccount {
  _id: string;
  name: string;
  status: string;
  [key: string]: any;
}

export const createLinkedAccount = async (data: any): Promise<any> => {
  return apiRequest(API_ENDPOINTS.LINKED_ACCOUNTS.CREATE, {
    method: 'POST',
    data,
  });
};

export const listLinkedAccounts = async (): Promise<any> => {
  return apiRequest(API_ENDPOINTS.LINKED_ACCOUNTS.LIST, {
    method: 'GET',
  });
};

export const viewLinkedAccount = async (id: string): Promise<any> => {
  return apiRequest(API_ENDPOINTS.LINKED_ACCOUNTS.VIEW(id), {
    method: 'GET',
  });
};

export const updateLinkedAccount = async (id: string, data: any): Promise<any> => {
  return apiRequest(API_ENDPOINTS.LINKED_ACCOUNTS.UPDATE(id), {
    method: 'PUT',
    data,
  });
};

export const updateLinkedAccountBank = async (id: string, data: any): Promise<any> => {
  return apiRequest(API_ENDPOINTS.LINKED_ACCOUNTS.UPDATE_BANK(id), {
    method: 'PUT',
    data,
  });
};

export const deleteLinkedAccount = async (id: string): Promise<void> => {
  return apiRequest(API_ENDPOINTS.LINKED_ACCOUNTS.DELETE(id), {
    method: 'DELETE',
  });
};

export const validateLinkedAccount = async (razorpayAccountId: string): Promise<any> => {
  return apiRequest(API_ENDPOINTS.LINKED_ACCOUNTS.VALIDATE, {
    method: 'POST',
    data: { razorpayAccountId },
  });
};

export const onboardStart = async (clusterId: string): Promise<any> => {
  return apiRequest(API_ENDPOINTS.LINKED_ACCOUNTS.ONBOARD_START, {
    method: 'POST',
    data: { clusterId },
  });
};
