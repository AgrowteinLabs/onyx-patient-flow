import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { listDoctors, getDoctorAvailability, Doctor, DoctorSlot } from "@/services/doctor.service";
import { createBooking, confirmBooking } from "@/services/booking.service";
import { 
  Stethoscope, 
  Star, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Search, 
  Award, 
  Languages,
  CheckCircle2,
  ShieldCheck,
  Sunrise,
  Sun,
  Sunset,
  RefreshCcw,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

const Doctors = () => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  // Booking integrations in-place
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
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
  const [openBookModal, setOpenBookModal] = useState(false);

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

  const loadDoctorsList = async () => {
    try {
      setLoading(true);
      const list = await listDoctors();
      setDoctors(list || []);
      setFilteredDoctors(list || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to fetch doctors list", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter & Search Logic
  useEffect(() => {
    let result = doctors;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q)
      );
    }

    if (selectedSpecialty !== "all") {
      result = result.filter(
        (d) => d.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
      );
    }

    setFilteredDoctors(result);
  }, [search, selectedSpecialty, doctors]);

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

  const handleOpenBooking = async (doc: Doctor) => {
    setBookingDoctor(doc);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setOpenBookModal(true);
    const docId = doc._id || doc.id || "";
    await fetchDoctorSlots(docId, selectedDate);
  };

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    if (bookingDoctor) {
      const docId = bookingDoctor._id || bookingDoctor.id || "";
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

  const handleConfirmAppointment = async () => {
    if (!bookingDoctor || !selectedSlot) return;

    if (isSlotPast(selectedDate, selectedSlot.startTime)) {
      toast({ title: "This time slot has already passed. Please select an upcoming slot.", variant: "destructive" });
      return;
    }

    try {
      setBookingLoading(true);
      const profileId = localStorage.getItem("selectedProfileId") || undefined;
      const docId = bookingDoctor._id || bookingDoctor.id || "";
      console.log("[Booking Flow] 🚀 Starting doctor booking confirmation. Doc ID:", docId, "Slot:", selectedSlot, "Date:", selectedDate);

      await loadRazorpayScript();
      console.log("[Booking Flow] SDK Loaded. window.Razorpay available:", !!(window as any).Razorpay);

      // 1. Create Booking
      console.log("[Booking Flow] Calling createBooking API...");
      const response = await createBooking(docId, {
        slotDate: selectedDate,
        slotTimeStart: selectedSlot.startTime,
        slotTimeEnd: selectedSlot.endTime,
        profileId,
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
              title: "Visit Confirmed!",
              description: `Your appointment with ${bookingDoctor.name} is successfully scheduled.`
            });
            setOpenBookModal(false);
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
      console.error("[Booking Flow] Error occurred inside handleConfirmAppointment:", err);
      toast({ title: err.message || "Failed to confirm appointment", variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
  };

  // Get unique specialties for filter tabs
  const specialties = ["all", ...new Set(doctors.map(d => d.specialty.toLowerCase()))];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Stethoscope className="h-8 w-8 text-[#2563eb]" /> Our Panel Specialists
        </h1>
        <p className="text-slate-500 text-sm mt-1">Consult with verified healthcare experts and hospital consultants</p>
      </div>

      {/* Filters and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by doctor name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Specialty Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {specialties.map((spec) => (
            <Button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              variant={selectedSpecialty === spec ? "default" : "outline"}
              className={`rounded-full text-xs font-bold capitalize px-4 h-8 shrink-0 ${
                selectedSpecialty === spec ? "bg-[#2563eb]" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              {spec}
            </Button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 bg-white rounded-[20px] shadow-sm animate-pulse border border-slate-100"></div>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200 bg-white">
          <Stethoscope className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-700">No doctors match your search</h3>
          <p className="text-slate-500 text-xs mt-1">Try resetting the specialty filters or adjusting your query terms.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <Card 
              key={doc._id || doc.id}
              className="bg-white border border-slate-100 hover:border-[#0ea5e9] shadow-sm hover:shadow-md hover-lift transition-all rounded-[20px] overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-[#0ea5e9]/10 text-[#2563eb] flex items-center justify-center font-bold text-xl uppercase shrink-0 shadow-sm border border-slate-50">
                    {doc.name[0]}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-wide truncate">{doc.name}</h3>
                    <Badge variant="secondary" className="bg-[#2563eb]/10 text-[#2563eb] border-none text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5">
                      {doc.specialty}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold pt-1">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span>{doc.rating || "4.8"}</span>
                      <span className="text-slate-400">({doc.experience || "10+ Yrs Exp"})</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-50 bg-slate-50/50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium">Languages</span>
                    <span className="font-bold text-slate-700">English, Hindi</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium">Availability</span>
                    <span className="font-bold text-emerald-600">Mon - Sat</span>
                  </div>
                </div>

                <Button 
                  onClick={() => handleOpenBooking(doc)}
                  className="w-full text-xs font-bold bg-[#2563eb] text-white rounded-xl shadow-md h-10 mt-2 hover:opacity-95"
                >
                  Book Appointment
                </Button>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Book Slots Inplace Dialog */}
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
                Confirm your preferred appointment slot with {bookingDoctor?.name}.
              </DialogDescription>
            </div>
          </div>

          {/* Scrollable content body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* 1. Doctor Profile Preview Card */}
            {bookingDoctor && (
              <div className="p-3.5 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-11 w-11 rounded-2xl bg-[#2563eb]/10 text-[#2563eb] font-black text-base flex items-center justify-center shrink-0">
                    {bookingDoctor.name[0]}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-extrabold text-slate-800 truncate">{bookingDoctor.name}</h4>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] text-slate-500 font-bold capitalize">{bookingDoctor.specialty}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-500" /> {bookingDoctor.rating || "4.8"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-slate-800">₹500</span>
                  <span className="block text-[9px] text-slate-400 font-semibold">Consult Fee</span>
                </div>
              </div>
            )}

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

            {/* 4. Selection Summary Pill */}
            {bookingDoctor && selectedSlot && (
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
                    <p className="text-[10px] text-slate-500 font-medium">with {bookingDoctor.name}</p>
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
                onClick={handleConfirmAppointment} 
                className="bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] hover:opacity-95 text-white font-bold rounded-xl shadow-md h-10 px-5 text-xs flex items-center gap-2"
                disabled={bookingLoading || !bookingDoctor || !selectedSlot}
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

export default Doctors;
