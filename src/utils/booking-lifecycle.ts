import { Booking } from "@/services/booking.service";

export type BookingCategory = "ready" | "upcoming" | "completed" | "missed" | "cancelled";

export interface BookingLifecycle {
  category: BookingCategory;
  label: string;
  badgeClass: string;
  isPast: boolean;
  startTime: Date | null;
  endTime: Date | null;
  formattedTime: string;
}

/**
 * Accurately parse the start and end times for a booking.
 */
export const getBookingTimes = (b: Booking): { startTime: Date | null; endTime: Date | null } => {
  let startTime: Date | null = null;
  let endTime: Date | null = null;

  if (b.slotDate && b.slotTimeStart) {
    const dateStr = b.slotDate.includes("T") ? b.slotDate.split("T")[0] : b.slotDate;
    const [sh, sm] = (b.slotTimeStart || "00:00").split(":").map(Number);
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      d.setHours(sh || 0, sm || 0, 0, 0);
      startTime = d;
    }

    if (b.slotTimeEnd) {
      const [eh, em] = (b.slotTimeEnd || "00:30").split(":").map(Number);
      const endD = new Date(dateStr);
      if (!isNaN(endD.getTime())) {
        endD.setHours(eh || 0, em || 0, 0, 0);
        endTime = endD;
      }
    } else if (startTime) {
      endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    }
  } else if (b.slot) {
    const d = new Date(b.slot);
    if (!isNaN(d.getTime())) {
      startTime = d;
      endTime = new Date(d.getTime() + 30 * 60 * 1000);
    }
  } else if (b.slotDate) {
    const d = new Date(b.slotDate);
    if (!isNaN(d.getTime())) {
      startTime = d;
      endTime = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  return { startTime, endTime };
};

/**
 * Determine the true lifecycle status of an appointment.
 * Automatically marks confirmed appointments whose slot has passed as "Missed / Unattended".
 */
export const getBookingLifecycle = (b: Booking): BookingLifecycle => {
  const rawStatus = (b.status || "").toLowerCase().trim();
  const { startTime, endTime } = getBookingTimes(b);
  const now = new Date();

  // 1. Explicit terminal statuses from backend
  if (rawStatus === "completed" || rawStatus === "attended") {
    return {
      category: "completed",
      label: "Completed",
      badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      isPast: true,
      startTime,
      endTime,
      formattedTime: formatBookingTime(startTime),
    };
  }

  if (rawStatus === "cancelled" || rawStatus === "canceled") {
    return {
      category: "cancelled",
      label: "Cancelled",
      badgeClass: "bg-slate-100 text-slate-500 border border-slate-200",
      isPast: true,
      startTime,
      endTime,
      formattedTime: formatBookingTime(startTime),
    };
  }

  // 2. Active in-progress call
  if (rawStatus === "in_progress" || rawStatus === "calling" || rawStatus === "active") {
    return {
      category: "ready",
      label: "In Progress",
      badgeClass: "bg-emerald-500 text-white animate-pulse border-none",
      isPast: false,
      startTime,
      endTime,
      formattedTime: formatBookingTime(startTime),
    };
  }

  // 3. If slot time has already passed and was never marked completed/attended -> MISSED!
  if (endTime && now > endTime) {
    return {
      category: "missed",
      label: "Missed / Unattended",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
      isPast: true,
      startTime,
      endTime,
      formattedTime: formatBookingTime(startTime),
    };
  }

  // 4. Ready to join (within 15 minutes before start time until end time)
  if (startTime && endTime) {
    const windowStart = new Date(startTime.getTime() - 15 * 60 * 1000);
    if (now >= windowStart && now <= endTime) {
      return {
        category: "ready",
        label: "Ready to Join",
        badgeClass: "bg-emerald-500 text-white animate-pulse border-none",
        isPast: false,
        startTime,
        endTime,
        formattedTime: formatBookingTime(startTime),
      };
    }
  }

  // 5. Future scheduled appointment
  return {
    category: "upcoming",
    label: b.status ? (b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase()) : "Confirmed",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
    isPast: false,
    startTime,
    endTime,
    formattedTime: formatBookingTime(startTime),
  };
};

export const formatBookingTime = (d: Date | null): string => {
  if (!d || isNaN(d.getTime())) return "Scheduled Slot";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
