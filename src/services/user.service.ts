import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface User {
  id: string;
  [key: string]: any;
}

export const viewUser = async (): Promise<User> => {
  return apiRequest(API_ENDPOINTS.USER.VIEW, {
    method: 'GET',
  });
};

export const updateUser = async (id: string, data: any): Promise<User> => {
  return apiRequest(API_ENDPOINTS.USER.UPDATE(id), {
    method: 'PUT',
    data,
  });
};

export const listUsers = async (): Promise<User[]> => {
  const endpoint = (API_ENDPOINTS.USER as any).LIST ?? '/users';
  return apiRequest(endpoint, {
    method: 'GET',
  });
};

export const deleteCurrentUser = async (): Promise<void> => {
  return apiRequest(API_ENDPOINTS.USER.DELETE, {
    method: 'DELETE',
  });
};