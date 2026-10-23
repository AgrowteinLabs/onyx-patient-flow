import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { listBookings, createBooking, confirmBooking, Booking } from "@/services/booking.service";
import { listDoctors, getDoctorAvailability, Doctor, DoctorSlot } from "@/services/doctor.service";
import { listReportsByProfile } from "@/services/report.service";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getBookingLifecycle } from "@/utils/booking-lifecycle";
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft,
  Star,
  MapPin,
  ShieldCheck,
  Sunrise,
  Sun,
  Sunset,
  Sparkles,
  Video,
  AlertTriangle,
  FileText,
  Lock
} from "lucide-react";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const Appointments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramDoctorId = searchParams.get("doctorId");
  const paramReportId = searchParams.get("reportId");
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openBookModal, setOpenBookModal] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    localStorage.getItem("selectedProfileId")
  );

  // Booking Form State
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [availableSlots, setAvailableSlots] = useState<DoctorSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<DoctorSlot | null>(null);
  const [activePeriod, setActivePeriod] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Report Sharing & Consent (ABDM & NMC Telemedicine Practice Guidelines)
  const [availableReports, setAvailableReports] = useState<any[]>([]);
  const [reportSharingScope, setReportSharingScope] = useState<"all" | "selected" | "none">("all");
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>(() => {
    return paramReportId ? [paramReportId] : [];
  });
  const [patientConsentGranted, setPatientConsentGranted] = useState(true);

  // Upcoming 7 days calendar generator
  const upcomingDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString(undefined, { weekday: "short" });
      const monthShort = d.toLocaleDateString(undefined, { month: "short" });
      const dayNum = d.getDate();
      dates.push({ dateStr, dayName, monthShort, dayNum });
    }
    return dates;
  }, []);

  // Format "09:30" to "9:30 AM"
  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || "0", 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  // Check if a slot has already passed for the given date
  const isSlotPast = (slotDateStr: string, slotStartTime: string) => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    if (slotDateStr < todayStr) return true;
    if (slotDateStr > todayStr) return false;

    const [h, m] = slotStartTime.split(":").map(Number);
    const slotMinutes = h * 60 + m;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return slotMinutes <= currentMinutes;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsList, doctorsList] = await Promise.all([
        listBookings(),
        listDoctors()
      ]);

      // Filter by active profile
      const storedProfileId = localStorage.getItem("selectedProfileId");
      const bookingsArr = Array.isArray(bookingsList) ? bookingsList : [];
      const filtered = bookingsArr.filter(b => b && (b.profileId === storedProfileId || !b.profileId));
      setBookings(filtered);
      const docs = doctorsList || [];
      setDoctors(docs);

      // Fetch patient's uploaded diagnostic reports for consent report sharing selection
      if (storedProfileId) {
        listReportsByProfile(storedProfileId).then((reps) => {
          const reportArray = Array.isArray(reps) ? reps : [];
          setAvailableReports(reportArray);
          if (paramReportId && !selectedReportIds.includes(paramReportId)) {
            setSelectedReportIds(prev => prev.includes(paramReportId) ? prev : [...prev, paramReportId]);
          }
        }).catch(() => {});
      }

      // If doctorId was passed in URL query param (e.g. from handover or doctor card), pre-select and open
      if (paramDoctorId && docs.length > 0) {
        const matchedDoc = docs.find((d: any) => d._id === paramDoctorId || d.id === paramDoctorId);
        if (matchedDoc) {
          setSelectedDoctor(matchedDoc);
          setOpenBookModal(true);
          const docId = matchedDoc._id || matchedDoc.id || "";
          fetchDoctorSlots(docId, selectedDate);
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load appointments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDoctorSlots = async (docId: string, dateStr: string) => {
    try {
      setLoadingSlots(true);
      setSelectedSlot(null);
      const slots = await getDoctorAvailability(docId, dateStr);
      setAvailableSlots(slots || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to fetch slots", variant: "destructive" });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDoctorChange = async (doctorId: string) => {
    const doc = doctors.find(d => d._id === doctorId || d.id === doctorId) || null;
    setSelectedDoctor(doc);
    setSelectedSlot(null);
    setAvailableSlots([]);

    if (!doc) return;
    const docId = doc._id || doc.id || "";
    await fetchDoctorSlots(docId, selectedDate);
  };

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    if (selectedDoctor) {
      const docId = selectedDoctor._id || selectedDoctor.id || "";
      await fetchDoctorSlots(docId, newDate);
    }
  };

  // Filter slots by morning, afternoon, evening
  const morningSlots = availableSlots.filter(s => {
    const h = parseInt(s.startTime.split(":")[0], 10);
    return h < 12;
  });
  const afternoonSlots = availableSlots.filter(s => {
    const h = parseInt(s.startTime.split(":")[0], 10);
    return h >= 12 && h < 17;
  });
  const eveningSlots = availableSlots.filter(s => {
    const h = parseInt(s.startTime.split(":")[0], 10);
    return h >= 17;
  });

  const filteredSlots = activePeriod === "morning"
    ? morningSlots
    : activePeriod === "afternoon"
    ? afternoonSlots
    : activePeriod === "evening"
    ? eveningSlots
    : availableSlots;

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) {
      toast({ title: "Please select a doctor and slot", variant: "destructive" });
      return;
    }

    if (isSlotPast(selectedDate, selectedSlot.startTime)) {
      toast({ title: "This time slot has already passed. Please select an upcoming slot.", variant: "destructive" });
      return;
    }

    try {
      setBookingLoading(true);
      const docId = selectedDoctor._id || selectedDoctor.id || "";
      const profileId = selectedProfileId || undefined;
      console.log("[Booking Flow] 🚀 Starting booking flow. Doc ID:", docId, "Slot:", selectedSlot, "Date:", selectedDate);

      await loadRazorpayScript();
      console.log("[Booking Flow] SDK Loaded. window.Razorpay available:", !!(window as any).Razorpay);

      // 1. Create Booking with ABDM / NMC Report Sharing Consent
      console.log("[Booking Flow] Calling createBooking API with reportSharing consent...");
      const reportSharingPayload = {
        scope: reportSharingScope,
        selectedReportIds: reportSharingScope === "selected" ? selectedReportIds : [],
        patientConsent: {
          granted: reportSharingScope !== "none" ? patientConsentGranted : false,
          purpose: "Telehealth Consultation & Clinical Evaluation"
        }
      };

      const response = await createBooking(docId, {
        slotDate: selectedDate,
        slotTimeStart: selectedSlot.startTime,
        slotTimeEnd: selectedSlot.endTime,
        profileId,
        type: "scheduled",
        reportSharing: reportSharingPayload,
        shareMedicalHistory: reportSharingScope === "all",
        selectedReportIds: reportSharingScope === "selected" ? selectedReportIds : [],
      }, profileId);
      console.log("[Booking Flow] createBooking API Response received:", response);
      
      if (response.error || !response.booking) {
        console.error("[Booking Flow] createBooking returned an error or missing booking:", response.error);
        throw new Error(response.error?.description || response.error?.message || "Failed to initiate booking. The doctor's settlement account may not be active.");
      }
      
      const bookingId = response.booking?._id || response.booking?.id || response._id || response.id;
      console.log("[Booking Flow] Parsed Booking ID:", bookingId);

      if (!bookingId) {
        throw new Error("Failed to get booking reference.");
      }

      // Branch for Demo Mode (Backend has APP_ENV=dev and DEMO_FREE_CONSULTATIONS=true)
      const isDemoPayment = response?.demoPayment === true || response?.data?.demoPayment === true;
      if (isDemoPayment) {
        console.log("[Booking Flow] Demo Mode Active (demoPayment: true): Skipping Razorpay Checkout entirely.");
        toast({
          title: "Appointment Booked (Demo Mode)!",
          description: "Your appointment has been successfully scheduled and confirmed."
        });
        setOpenBookModal(false);
        setBookingLoading(false);
        loadData();
        return;
      }

      // 2. Initialize Razorpay Checkout
      const razorpayOrderId = response.razorpayOrderId || response.order?.id || response.booking?.razorpayOrderId;
      const rzpKey = response.key || response.razorpayKey || "rzp_live_SSEMZ6dhpfXToh";
      console.log("[Booking Flow] Payment Parameters - razorpayOrderId:", razorpayOrderId, "rzpKey:", rzpKey);

      if (!razorpayOrderId) {
        throw new Error("Razorpay Order ID was not returned by server. Please try again.");
      }

      if (!(window as any).Razorpay) {
        throw new Error("Razorpay Checkout failed to load. Please check your internet connection.");
      }

      const userDetails = { name: "", email: "", contact: "" };
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const u = JSON.parse(userStr);
          userDetails.name = u.name || "";
          userDetails.email = u.email || "";
          userDetails.contact = u.phone || u.contact || "";
        }
      } catch (e) {
        console.error("[Booking Flow] Failed to parse user details from localStorage:", e);
      }

      const options = {
        key: rzpKey,
        amount: response.amount || response.order?.amount || response.booking?.amountPaise || response.booking?.amount || 50000,
        currency: response.currency || response.order?.currency || "INR",
        name: "Onyx Health Plus",
        description: "Doctor Consultation Booking",
        order_id: razorpayOrderId,
        config: {
          display: {
            blocks: {
              qr_block: {
                name: "Scan & Pay via UPI QR",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr"],
                  },
                ],
              },
              other_block: {
                name: "Other Payment Modes",
                instruments: [
                  { method: "upi", flows: ["intent", "collect"] },
                  { method: "card" },
                  { method: "netbanking" },
                ],
              },
            },
            sequence: ["block.qr_block", "block.other_block"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        handler: async function (paymentRes: any) {
          console.log("[Booking Flow] Razorpay payment successful callback received. Payment ID:", paymentRes.razorpay_payment_id, "Order ID:", paymentRes.razorpay_order_id);
          try {
            setBookingLoading(true);
            console.log("[Booking Flow] Calling confirmBooking API with payment signature...");
            await confirmBooking({
              bookingId,
              razorpay_payment_id: paymentRes.razorpay_payment_id,
              razorpay_order_id: paymentRes.razorpay_order_id,
              razorpay_signature: paymentRes.razorpay_signature,
            });
            console.log("[Booking Flow] Booking successfully confirmed on backend!");
            toast({
              title: "Appointment Booked!",
              description: "Your appointment has been successfully scheduled and confirmed."
            });
            setOpenBookModal(false);
            loadData();
          } catch (confirmErr: any) {
            console.error("[Booking Flow] Backend booking confirmation failed:", confirmErr);
            toast({ title: confirmErr.message || "Failed to confirm payment on backend", variant: "destructive" });
          } finally {
            setBookingLoading(false);
          }
        },
        prefill: {
          contact: userDetails.contact,
          email: userDetails.email,
          method: "upi",
        },
        theme: {
          color: "#0D9488",
        },
        modal: {
          ondismiss: function () {
            console.log("[Booking Flow] Razorpay checkout overlay dismissed by user.");
            toast({ title: "Payment cancelled by user.", variant: "destructive" });
            setBookingLoading(false);
          }
        }
      };
      
      console.log("[Booking Flow] Launching Razorpay checkout overlay with options:", options);
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("[Booking Flow] Error occurred inside handleBookAppointment:", err);
      toast({ title: err.message || "Failed to book appointment", variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
  };

  const upcoming = useMemo(() => {
    const list = bookings.filter((b) => {
      const { isPast } = getBookingLifecycle(b);
      return !isPast;
    });
    return list.sort((a, b) => {
      const timeA = new Date(a.slot || a.slotDate || 0).getTime();
      const timeB = new Date(b.slot || b.slotDate || 0).getTime();
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });
  }, [bookings]);

  const past = useMemo(() => {
    const list = bookings.filter((b) => {
      const { isPast } = getBookingLifecycle(b);
      return isPast;
    });
    return list.sort((a, b) => {
      const timeA = new Date(a.slot || a.slotDate || 0).getTime();
      const timeB = new Date(b.slot || b.slotDate || 0).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [bookings]);

  // Pagination states for History
  const [pastPage, setPastPage] = useState(1);
  const pastPerPage = 5;
  const totalPastPages = Math.ceil(past.length / pastPerPage) || 1;
  const paginatedPast = useMemo(() => {
    return past.slice((pastPage - 1) * pastPerPage, pastPage * pastPerPage);
  }, [past, pastPage]);

  // Doctor panel search & pagination in Appointments
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorPage, setDoctorPage] = useState(1);
  const doctorsPerPage = 3;
  const filteredPanelDoctors = useMemo(() => {
    return doctors.filter(
      (d) =>
        d.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        d.specialty?.toLowerCase().includes(doctorSearch.toLowerCase())
    );
  }, [doctors, doctorSearch]);
  const totalDoctorPages = Math.ceil(filteredPanelDoctors.length / doctorsPerPage) || 1;
  const paginatedDoctors = useMemo(() => {
    return filteredPanelDoctors.slice((doctorPage - 1) * doctorsPerPage, doctorPage * doctorsPerPage);
  }, [filteredPanelDoctors, doctorPage]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8 text-[#2563eb]" /> Appointments
          </h1>
          <p className="text-slate-500 text-sm mt-1">Book and manage clinic consultations and online visits</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadData} disabled={loading} className="rounded-full">
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setOpenBookModal(true)} className="bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] text-white rounded-full font-bold shadow-md">
            <Plus className="h-4 w-4 mr-2" /> Book Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Upcoming Appointments */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">Upcoming Visits</CardTitle>
              <CardDescription className="text-xs text-slate-400">Your scheduled consultations and online video appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">No upcoming appointments scheduled</p>
                  <Button onClick={() => setOpenBookModal(true)} size="sm" className="mt-3 bg-[#2563eb]">Book Consultation</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcoming.map((b) => {
                    const lifecycle = getBookingLifecycle(b);
                    return (
                      <div key={b._id || b.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-100 bg-slate-50">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-[#2563eb] font-bold text-lg uppercase shrink-0">
                            {b.doctorId?.name ? b.doctorId.name[0] : "D"}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">{b.doctorId?.name || "Medical Expert"}</h3>
                            <Badge variant="secondary" className="bg-[#2563eb]/10 text-[#2563eb] border-none text-[8.5px] font-bold uppercase tracking-wider">
                              {b.doctorId?.specialty || "General Medicine"}
                            </Badge>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold mt-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-300" />
                              <span>Clinic Wing B, General Hospital</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/50">
                          <div className="text-left md:text-right space-y-0.5">
                            <div className="text-xs font-black text-slate-700 flex items-center gap-1 justify-start md:justify-end">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {lifecycle.formattedTime}
                            </div>
                            <p className="text-[9px] text-slate-400">Appointment Slot Time</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${lifecycle.badgeClass} text-[9px] font-bold capitalize px-2.5 py-0.5`}>
                              {lifecycle.label}
                            </Badge>
                            {lifecycle.category === "ready" && (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/dashboard/user/consultations?bookingId=${b._id || b.id}&autoJoin=true`)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm h-8 px-3"
                              >
                                <Video className="h-3.5 w-3.5 mr-1" /> Join Call
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past/History Appointments */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">Visit History</CardTitle>
              <CardDescription className="text-xs text-slate-400">Overview of completed, missed and cancelled checkups</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-24 bg-slate-50 rounded-xl animate-pulse"></div>
              ) : past.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No consultation history recorded</p>
              ) : (
                <div className="space-y-3">
                  <div className="divide-y divide-slate-100">
                    {paginatedPast.map((b) => {
                      const lifecycle = getBookingLifecycle(b);
                      return (
                        <div key={b._id || b.id} className="py-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase shrink-0">
                              {b.doctorId?.name ? b.doctorId.name[0] : "D"}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-xs">{b.doctorId?.name || "Medical Practitioner"}</h4>
                              <span className="text-[9px] text-slate-400 font-medium block">
                                {lifecycle.formattedTime}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${lifecycle.badgeClass} text-[8.5px] font-bold px-2 py-0.5`}>
                              {lifecycle.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {past.length > pastPerPage && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-[10.5px] text-slate-400">
                        Showing {(pastPage - 1) * pastPerPage + 1} - {Math.min(pastPage * pastPerPage, past.length)} of {past.length}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPastPage((p) => Math.max(1, p - 1))}
                          disabled={pastPage === 1}
                          className="h-7 px-2.5 rounded-lg border-slate-200 text-xs font-bold"
                        >
                          <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Prev
                        </Button>
                        <span className="px-1.5 font-mono text-[11px] font-bold text-slate-700">
                          {pastPage} / {totalPastPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPastPage((p) => Math.min(totalPastPages, p + 1))}
                          disabled={pastPage >= totalPastPages}
                          className="h-7 px-2.5 rounded-lg border-slate-200 text-xs font-bold"
                        >
                          Next <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick Doctor Availability list */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-800">Our Panel Doctors</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Consult top rated experts instantly</CardDescription>
                </div>
                <Badge className="bg-blue-50 text-[#2563eb] border-none text-[10px] font-bold">
                  {doctors.length} Doctors
                </Badge>
              </div>

              {/* Quick Search */}
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Search doctor or specialty..."
                  value={doctorSearch}
                  onChange={(e) => {
                    setDoctorSearch(e.target.value);
                    setDoctorPage(1);
                  }}
                  className="w-full h-8 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 font-medium"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {paginatedDoctors.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 font-medium">No doctors match your search</p>
              ) : (
                paginatedDoctors.map((doc) => (
                  <div key={doc._id || doc.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col gap-2.5">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#0ea5e9]/10 text-[#2563eb] flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-2xs">
                        {doc.name[0]}
                      </div>
                      <div className="space-y-0.5 overflow-hidden flex-1">
                        <h4 className="font-extrabold text-xs text-slate-800 truncate">{doc.name}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold capitalize truncate">{doc.specialty}</p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <div className="flex items-center text-amber-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-[10px] font-bold text-slate-700 ml-0.5">{doc.rating || "4.8"}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium">({doc.experience || "10+ Yrs Exp"})</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs font-bold rounded-xl border-slate-200 hover:bg-blue-50/50 hover:text-[#2563eb] hover:border-blue-200 bg-white shadow-2xs h-8"
                      onClick={() => {
                        setOpenBookModal(true);
                        handleDoctorChange(doc._id || doc.id || "");
                      }}
                    >
                      Book Consultation
                    </Button>
                  </div>
                ))
              )}

              {filteredPanelDoctors.length > doctorsPerPage && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-400 text-[10px]">
                    Page {doctorPage} of {totalDoctorPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDoctorPage((p) => Math.max(1, p - 1))}
                      disabled={doctorPage === 1}
                      className="h-7 px-2 rounded-lg border-slate-200 text-[10px] font-bold"
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDoctorPage((p) => Math.min(totalDoctorPages, p + 1))}
                      disabled={doctorPage >= totalDoctorPages}
                      className="h-7 px-2 rounded-lg border-slate-200 text-[10px] font-bold"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Book Appointment Dialog */}
      <Dialog open={openBookModal} onOpenChange={setOpenBookModal}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl p-0 overflow-hidden rounded-[26px] border border-slate-100 shadow-2xl bg-white max-h-[92vh] flex flex-col">
          {/* Accent top gradient */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#0d9488]" />

          {/* Header */}
          <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#2563eb]/10 text-[#2563eb] hover:bg-[#2563eb]/15 border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">
                  Telehealth & Clinic
                </Badge>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified Specialists
                </span>
              </div>
              <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">
                Schedule Consultation
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Pick your preferred specialist, consult date, and live availability slot.
              </DialogDescription>
            </div>
          </div>

          {/* Scrollable content body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* 1. Doctor Selection / Selected Doctor Preview */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Choose Specialist *</span>
                {selectedDoctor && (
                  <span className="text-[11px] text-[#2563eb] font-semibold lowercase">
                    {doctors.length} doctors available
                  </span>
                )}
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-6">
                  <select
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    value={selectedDoctor ? (selectedDoctor._id || selectedDoctor.id) : ""}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white h-11 px-3 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] transition-all shadow-xs"
                  >
                    <option value="">-- Choose Doctor / Specialist --</option>
                    {doctors.map((d) => (
                      <option key={d._id || d.id} value={d._id || d.id}>
                        {d.name} • {d.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDoctor && (
                  <div className="md:col-span-6 p-2.5 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-9 w-9 rounded-full bg-[#2563eb]/10 text-[#2563eb] font-black text-sm flex items-center justify-center shrink-0">
                        {selectedDoctor.name[0]}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-extrabold text-slate-800 truncate">{selectedDoctor.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium capitalize truncate">{selectedDoctor.specialty}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-800">₹500</span>
                      <span className="block text-[9px] text-slate-400 font-semibold">per visit</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedDoctor && (
              <>
                {/* 2. Date Selection Carousel */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#2563eb]" /> Select Date *
                    </Label>
                    <span className="text-[11px] font-bold text-slate-500">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scroll-smooth">
                    {upcomingDates.map((d) => {
                      const isSelected = selectedDate === d.dateStr;
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => handleDateChange(d.dateStr)}
                          className={`flex-1 min-w-[76px] py-2 px-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] text-white border-[#2563eb] shadow-md shadow-blue-500/20 scale-[1.02]"
                              : "bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                            {d.dayName}
                          </span>
                          <span className={`text-base font-black ${isSelected ? "text-white" : "text-slate-800"}`}>
                            {d.dayNum}
                          </span>
                          <span className={`text-[9px] font-semibold uppercase ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                            {d.monthShort}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Time Slots Section with Period Tabs */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#2563eb]" /> Available Time Slots *
                    </Label>

                    {/* Period Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setActivePeriod("all")}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                          activePeriod === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        All ({availableSlots.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePeriod("morning")}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          activePeriod === "morning" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Sunrise className="h-2.5 w-2.5 text-amber-500" /> Morning ({morningSlots.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePeriod("afternoon")}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          activePeriod === "afternoon" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Sun className="h-2.5 w-2.5 text-orange-500" /> Afternoon ({afternoonSlots.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePeriod("evening")}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          activePeriod === "evening" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Sunset className="h-2.5 w-2.5 text-indigo-500" /> Evening ({eveningSlots.length})
                      </button>
                    </div>
                  </div>

                  {loadingSlots ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <RefreshCcw className="h-6 w-6 animate-spin text-[#2563eb]" />
                      <p className="text-xs font-semibold">Loading doctor's availability schedule...</p>
                    </div>
                  ) : filteredSlots.length === 0 ? (
                    <div className="py-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center p-4">
                      <Clock className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-700">No slots available for this period</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Please pick another date or switch to a different period.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                      {filteredSlots.map((slot) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime;
                        const isBooked = slot.isBooked;
                        const isPast = isSlotPast(selectedDate, slot.startTime);
                        const isDisabled = isBooked || isPast;

                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => !isDisabled && setSelectedSlot(slot)}
                            className={`relative p-2.5 rounded-xl border text-left transition-all ${
                              isBooked
                                ? "bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                                : isPast
                                ? "bg-slate-50/80 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-50"
                                : isSelected
                                ? "bg-blue-50/70 border-[#2563eb] ring-2 ring-[#2563eb]/20 shadow-xs cursor-pointer"
                                : "bg-white border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/80 cursor-pointer shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-extrabold ${
                                isSelected ? "text-[#2563eb]" : isDisabled ? "text-slate-400" : "text-slate-800"
                              }`}>
                                {formatTime12h(slot.startTime)}
                              </span>
                              {isBooked ? (
                                <span className="text-[8.5px] font-bold text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded-md">
                                  Booked
                                </span>
                              ) : isPast ? (
                                <span className="text-[8.5px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-md">
                                  Passed
                                </span>
                              ) : isSelected ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#2563eb]" />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              )}
                            </div>
                            <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">
                              to {formatTime12h(slot.endTime)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 3. Medical History & Report Sharing (Consent & Doctor Agreement - ABDM/NMC) */}
            {selectedDoctor && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#2563eb]" /> Medical History & Report Sharing *
                  </Label>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[8.5px] px-2 py-0.5 w-fit">
                    ABDM & NMC Telemedicine Compliant
                  </Badge>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Adhering to the Ayushman Bharat Digital Mission (ABDM) consent architecture and NMC Telemedicine Practice Guidelines, configure how your diagnostic records should be shared with <span className="font-semibold text-slate-800">Dr. {selectedDoctor.name}</span> for this visit.
                </p>

                {/* Scope Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: All Reports */}
                  <div
                    onClick={() => setReportSharingScope("all")}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      reportSharingScope === "all"
                        ? "bg-blue-50/70 border-[#2563eb] ring-2 ring-[#2563eb]/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold ${reportSharingScope === "all" ? "text-[#2563eb]" : "text-slate-800"}`}>
                          Share Full History
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-800 text-[8px] font-bold border-none px-1 py-0">
                          Recommended
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Grants complete access to past test reports & medical history for clinical evaluation.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Selected Reports */}
                  <div
                    onClick={() => setReportSharingScope("selected")}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      reportSharingScope === "selected"
                        ? "bg-blue-50/70 border-[#2563eb] ring-2 ring-[#2563eb]/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold ${reportSharingScope === "selected" ? "text-[#2563eb]" : "text-slate-800"}`}>
                          Select Reports
                        </span>
                        {selectedReportIds.length > 0 && (
                          <Badge className="bg-[#2563eb] text-white text-[8px] font-bold border-none px-1.5 py-0">
                            {selectedReportIds.length} picked
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Pick only specific diagnostic reports you want the doctor to evaluate.
                      </p>
                    </div>
                  </div>

                  {/* Option 3: Do Not Share */}
                  <div
                    onClick={() => setReportSharingScope("none")}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      reportSharingScope === "none"
                        ? "bg-blue-50/70 border-[#2563eb] ring-2 ring-[#2563eb]/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold ${reportSharingScope === "none" ? "text-[#2563eb]" : "text-slate-800"}`}>
                          Do Not Share
                        </span>
                        <Lock className="h-3 w-3 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Doctor will conduct consultation without access to prior diagnostic files.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-selector for Selected Reports */}
                {reportSharingScope === "selected" && (
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider">
                        Available Reports ({availableReports.length})
                      </span>
                      {paramReportId && (
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          Linked screening report #{paramReportId.slice(-6)} auto-selected
                        </span>
                      )}
                    </div>
                    {availableReports.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">No uploaded reports found for this profile.</p>
                    ) : (
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {availableReports.map((rep) => {
                          const repId = rep._id || rep.id;
                          const isChecked = selectedReportIds.includes(repId);
                          return (
                            <label
                              key={repId}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? "bg-blue-50 border-blue-200 text-blue-900 font-semibold"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedReportIds([...selectedReportIds, repId]);
                                    } else {
                                      setSelectedReportIds(selectedReportIds.filter(id => id !== repId));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb] h-3.5 w-3.5"
                                />
                                <span className="truncate">{rep.reportCode || rep.name || `Report #${repId.slice(-6)}`}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(rep.createdAt || Date.now()).toLocaleDateString()}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Consent Checkbox */}
                {reportSharingScope !== "none" && (
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/70 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="patient-consent-grant"
                      checked={patientConsentGranted}
                      onChange={(e) => setPatientConsentGranted(e.target.checked)}
                      className="mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                    />
                    <label htmlFor="patient-consent-grant" className="text-[11px] text-emerald-950 font-medium leading-relaxed cursor-pointer">
                      <span className="font-bold">Patient Consent Declaration:</span> I hereby grant consent to <span className="font-bold">Dr. {selectedDoctor.name}</span> to access my {reportSharingScope === "all" ? "complete medical history and diagnostic reports" : `${selectedReportIds.length} selected report(s)`} strictly for the purpose of <span className="font-bold">Telehealth Consultation & Clinical Evaluation</span> in accordance with NMC Telemedicine Practice Guidelines.
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* 4. Selection Summary Pill */}
            {selectedDoctor && selectedSlot && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-emerald-50/50 to-blue-50/80 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointment Overview</p>
                    <h5 className="text-xs font-black text-slate-800">
                      {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} • {formatTime12h(selectedSlot.startTime)} - {formatTime12h(selectedSlot.endTime)}
                    </h5>
                    <p className="text-[10px] text-slate-500 font-medium">with {selectedDoctor.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span className="text-[9.5px] text-emerald-700 font-semibold">
                        {reportSharingScope === "all"
                          ? "Full Medical History Shared (Consent Granted)"
                          : reportSharingScope === "selected"
                          ? `${selectedReportIds.length} Report(s) Shared (Consent Granted)`
                          : "No Diagnostic Reports Shared"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:border-l sm:border-blue-200/60 sm:pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Consult Fee</span>
                  <span className="text-sm font-black text-slate-800">₹500</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-row items-center justify-between gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Secure checkout powered by Razorpay</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-xl border-slate-200 text-slate-600 font-bold text-xs h-10 px-4 hover:bg-slate-100" 
                onClick={() => setOpenBookModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBookAppointment} 
                className="bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] hover:opacity-95 text-white font-bold rounded-xl shadow-md h-10 px-5 text-xs flex items-center gap-2"
                disabled={bookingLoading || !selectedDoctor || !selectedSlot || (reportSharingScope !== "none" && !patientConsentGranted)}
              >
                {bookingLoading ? (
                  <>
                    <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Pay ₹500</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Appointments;
