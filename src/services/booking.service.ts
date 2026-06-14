import { apiRequest } from '@/lib/api-request';
import { API_ENDPOINTS } from '@/lib/api-config';

export interface Booking {
  _id: string;
  id?: string;
  doctorId: {
    _id: string;
    name: string;
    specialty: string;
    photo?: string;
  };
  slot: string;
  status: string;
  profileId?: string;
  createdAt?: string;
  [key: string]: any;
}

export const createBooking = async (
  doctorId: string,
  slot: string,
  profileId?: string
): Promise<any> => {
  const dateObj = new Date(slot);
  const slotDate = dateObj.toISOString();
  
  const hours = String(dateObj.getUTCHours()).padStart(2, '0');
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
  const slotTimeStart = `${hours}:${minutes}`;
  
  const endDateObj = new Date(dateObj.getTime() + 30 * 60 * 1000);
  const endHours = String(endDateObj.getUTCHours()).padStart(2, '0');
  const endMinutes = String(endDateObj.getUTCMinutes()).padStart(2, '0');
  const slotTimeEnd = `${endHours}:${endMinutes}`;

  const data: any = {
    doctorId,
    type: 'scheduled',
    slotDate,
    slotTimeStart,
    slotTimeEnd,
  };

  if (profileId) {
    data.profileId = profileId;
  }

  return apiRequest(API_ENDPOINTS.BOOKING.CREATE, {
    method: 'POST',
    data,
  });
};

export const confirmBooking = async (
  bookingId: string,
  paymentId: string = "pay_mock123456",
  orderId: string = "order_mock123456",
  signature: string = "sig_mock123456"
): Promise<any> => {
  return apiRequest(API_ENDPOINTS.BOOKING.CONFIRM, {
    method: 'POST',
    data: {
      bookingId,
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      razorpay_signature: signature,
    },
  });
};

export const listBookings = async (): Promise<Booking[]> => {
  const res: any = await apiRequest(API_ENDPOINTS.BOOKING.LIST, {
    method: 'GET',
  });
  return res.bookings || res.data || (Array.isArray(res) ? res : []);
};
