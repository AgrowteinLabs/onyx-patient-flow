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

export interface DoctorSlot {
  startTime: string; // e.g. "09:30"
  endTime: string;   // e.g. "10:00"
  isBooked: boolean;
  date?: string;     // e.g. "2026-10-21"
}

export const getDoctorAvailability = async (
  doctorId: string, 
  date?: string
): Promise<DoctorSlot[]> => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const queryDate = date || `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const res: any = await apiRequest(`/api/doctor/availability?doctorId=${doctorId}&date=${queryDate}`, { method: "GET" });
  
  const slotsData = res.slots || res.availability || [];
  const dateStr = res.date || queryDate;

  if (Array.isArray(slotsData)) {
    return slotsData.map((slot: any) => {
      if (typeof slot === 'string') {
        return {
          startTime: slot,
          endTime: slot,
          isBooked: false,
          date: dateStr,
        };
      }
      return {
        startTime: slot.startTime || slot.time || "00:00",
        endTime: slot.endTime || "00:00",
        isBooked: Boolean(slot.isBooked),
        date: dateStr,
      };
    });
  }
  return [];
};
