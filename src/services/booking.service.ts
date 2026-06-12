import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export const createBooking = async (doctorId: string, slot: string): Promise<any> => {
  return apiRequest(API_ENDPOINTS.BOOKING.CREATE, {
    method: 'POST',
    data: { doctorId, slot },
  });
};

export const confirmBooking = async (bookingId: string): Promise<any> => {
  return apiRequest(API_ENDPOINTS.BOOKING.CONFIRM, {
    method: 'POST',
    data: { bookingId },
  });
};

export const listBookings = async (): Promise<any> => {
  return apiRequest(API_ENDPOINTS.BOOKING.LIST, {
    method: 'GET',
  });
};
