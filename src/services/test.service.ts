import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface Test {
  id: string;
  [key: string]: any;
}

export const addTest = async (data: any): Promise<Test> => {
  return apiRequest(API_ENDPOINTS.TEST.ADD, {
    method: 'POST',
    data,
  });
};

export const listTests = async (): Promise<Test[]> => {
  return apiRequest(API_ENDPOINTS.TEST.LIST, {
    method: 'GET',
  });
};
