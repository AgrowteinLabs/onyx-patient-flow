import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface Model {
  id: string;
  [key: string]: any;
}

export const addModel = async (data: any): Promise<Model> => {
  return apiRequest(API_ENDPOINTS.MODEL.ADD, {
    method: 'POST',
    data,
  });
};
