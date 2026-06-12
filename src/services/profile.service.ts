import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface Profile {
  id: string;
  [key: string]: any;
}

export const createProfile = async (data: any): Promise<Profile> => {
  return apiRequest(API_ENDPOINTS.PROFILE.CREATE, {
    method: 'POST',
    data,
  });
};

export const getProfiles = async (): Promise<Profile[]> => {
  return apiRequest(API_ENDPOINTS.PROFILE.GET_ALL, {
    method: 'GET',
  });
};

export const viewProfile = async (id: string): Promise<Profile> => {
  return apiRequest(API_ENDPOINTS.PROFILE.VIEW(id), {
    method: 'GET',
  });
};

export const updateProfile = async (id: string, data: any): Promise<Profile> => {
  return apiRequest(API_ENDPOINTS.PROFILE.UPDATE(id), {
    method: 'PUT',
    data,
  });
};

export const deleteProfile = async (id: string): Promise<void> => {
  return apiRequest(API_ENDPOINTS.PROFILE.DELETE(id), {
    method: 'DELETE',
  });
};
