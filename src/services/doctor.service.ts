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
  
  const slotsData = res.slots || res.availability || [];
  if (Array.isArray(slotsData)) {
    if (slotsData.length > 0 && typeof slotsData[0] === 'string') {
      return slotsData;
    }
    const dateStr = res.date || queryDate;
    return slotsData
      .filter((slot: any) => !slot.isBooked)
      .map((slot: any) => {
        const time = slot.startTime || slot.time || "00:00";
        return `${dateStr}T${time}:00.000Z`;
      });
  }
  return [];
};
