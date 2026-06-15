import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface Doctor {
  _id: string;
  id?: string;
  name: string;
  specialty: string;
  experience?: string;
  rating?: number;
  photo?: string;
  availability?: string[];
  [key: string]: any;
}

export const listDoctors = async (): Promise<Doctor[]> => {
  const res: any = await apiRequest(API_ENDPOINTS.DOCTOR.LIST, { method: "GET" });
  return res.doctors || res.data || (Array.isArray(res) ? res : []);
};

export const getDoctorAvailability = async (doctorId: string, date?: string): Promise<string[]> => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const queryDate = date || `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const res: any = await apiRequest(`/api/doctor/availability?doctorId=${doctorId}&date=${queryDate}`, { method: "GET" });
  return res.availability || res.slots || (Array.isArray(res) ? res : []);
};
