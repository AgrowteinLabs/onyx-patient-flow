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