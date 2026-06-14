import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface Profile {
  _id: string;
  id?: string;
  name: string;
  dob: string;
  gender: string;
  age?: number;
  height?: number;
  weight?: number;
  blood_group?: string;
  bloodGroup?: string;
  bmi?: number;
  phone_number?: string[];
  email?: string;
  isMain?: boolean;
  patientCode?: string;
  [key: string]: any;
}

export const createProfile = async (data: any): Promise<Profile> => {
  return apiRequest(API_ENDPOINTS.PROFILE.CREATE, {
    method: 'POST',
    data,
  });
};

export const getProfiles = async (): Promise<Profile[]> => {
  const res: any = await apiRequest(API_ENDPOINTS.PROFILE.GET_ALL, {
    method: 'GET',
  });
  const list = res?.profiles || res?.data || (Array.isArray(res) ? res : []);
  return list.map((p: any) => {
    if (p?.dob && !p?.age) {
      const birthYear = new Date(p.dob).getFullYear();
      p.age = new Date().getFullYear() - birthYear;
    }
    return p;
  });
};

export const viewProfile = async (id: string): Promise<Profile> => {
  const res: any = await apiRequest(API_ENDPOINTS.PROFILE.VIEW(id), {
    method: 'GET',
  });
  if (res?.dob && !res?.age) {
    const birthYear = new Date(res.dob).getFullYear();
    res.age = new Date().getFullYear() - birthYear;
  }
  return res;
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
