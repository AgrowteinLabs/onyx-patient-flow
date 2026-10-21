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

export interface CreateBookingSlotParams {
  slotDate: string;
  slotTimeStart: string;
  slotTimeEnd: string;
  profileId?: string;
}

export const createBooking = async (
  doctorId: string,
  slotOrDetails: string | CreateBookingSlotParams,
  profileId?: string
): Promise<any> => {
  let slotDate: string;
  let slotTimeStart: string;
  let slotTimeEnd: string;
  let targetProfileId = profileId;

  if (typeof slotOrDetails === 'object' && slotOrDetails !== null) {
    slotTimeStart = slotOrDetails.slotTimeStart;
    slotTimeEnd = slotOrDetails.slotTimeEnd;
    targetProfileId = slotOrDetails.profileId || profileId;
    const d = new Date(slotOrDetails.slotDate);
    slotDate = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
  } else {
    const dateObj = new Date(slotOrDetails as string);
    slotDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : new Date().toISOString();
    
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    slotTimeStart = `${hours}:${minutes}`;
    
    const endDateObj = new Date(dateObj.getTime() + 30 * 60 * 1000);
    const endHours = String(endDateObj.getHours()).padStart(2, '0');
    const endMinutes = String(endDateObj.getMinutes()).padStart(2, '0');
    slotTimeEnd = `${endHours}:${endMinutes}`;
  }

  const data: any = {
    doctorId,
    type: 'scheduled',
    slotDate,
    slotTimeStart,
    slotTimeEnd,
  };

  if (targetProfileId) {
    data.profileId = targetProfileId;
  }

  return apiRequest(API_ENDPOINTS.BOOKING.CREATE, {
    method: 'POST',
    data,
  });
};

export interface ConfirmBookingPayload {
  bookingId: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export const confirmBooking = async (
  bookingIdOrPayload: string | ConfirmBookingPayload,
  paymentId?: string,
  orderId?: string,
  signature?: string
): Promise<any> => {
  const data = typeof bookingIdOrPayload === "object"
    ? bookingIdOrPayload
    : {
        bookingId: bookingIdOrPayload,
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      };

  return apiRequest(API_ENDPOINTS.BOOKING.CONFIRM, {
    method: 'POST',
    data,
  });
};

export const listBookings = async (): Promise<Booking[]> => {
  const res: any = await apiRequest(API_ENDPOINTS.BOOKING.LIST, {
    method: 'GET',
  });
  return res.bookings || res.data || (Array.isArray(res) ? res : []);
};

export const getPrescription = async (bookingId: string): Promise<any> => {
  return apiRequest(`/api/prescription/${bookingId}`, { method: "GET" });
};
