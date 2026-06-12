import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface Product {
  id: string;
  [key: string]: any;
}

export const addProduct = async (data: any): Promise<Product> => {
  return apiRequest(API_ENDPOINTS.PRODUCT.ADD, {
    method: 'POST',
    data,
  });
};

export const getProductTests = async (deviceCode: string): Promise<any[]> => {
  return apiRequest(API_ENDPOINTS.PRODUCT.GET_TESTS(deviceCode), {
    method: 'GET',
  });
};
