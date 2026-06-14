import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { listBookings, createBooking, confirmBooking, Booking } from "@/services/booking.service";
import { listDoctors, getDoctorAvailability, Doctor } from "@/services/doctor.service";
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Star,
  MapPin
} from "lucide-react";

const Appointments = () => {
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
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

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
      setDoctors(doctorsList || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load appointments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDoctorChange = async (doctorId: string) => {
    const doc = doctors.find(d => d._id === doctorId || d.id === doctorId) || null;
    setSelectedDoctor(doc);
    setSelectedSlot("");
    setAvailableSlots([]);

    if (!doc) return;

    try {
      setLoadingSlots(true);
      const docId = doc._id || doc.id || "";
      const slots = await getDoctorAvailability(docId);
      
      // If mock slots empty, generate some slots
      if (!slots || slots.length === 0) {
        setAvailableSlots([]);
      } else {
        setAvailableSlots(slots);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to fetch slots", variant: "destructive" });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) {
      toast({ title: "Please select a doctor and slot", variant: "destructive" });
      return;
    }

    try {
      setBookingLoading(true);
      const docId = selectedDoctor._id || selectedDoctor.id || "";
      const profileId = selectedProfileId || undefined;

      // 1. Create Booking
      const response = await createBooking(docId, selectedSlot, profileId);
      const bookingId = response.booking?._id || response.booking?.id || response._id || response.id;

      if (!bookingId) {
        throw new Error("Failed to get booking reference.");
      }

      // 2. Confirm Booking
      await confirmBooking(bookingId);

      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been successfully scheduled and confirmed."
      });
      setOpenBookModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast({ title: err.message || "Failed to book appointment", variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
  };

  const upcoming = bookings.filter(b => b.status !== "Completed" && b.status !== "Cancelled");
  const past = bookings.filter(b => b.status === "Completed" || b.status === "Cancelled");

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
                  {upcoming.map((b) => (
                    <div key={b._id || b.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-[#2563eb] font-bold text-lg uppercase shrink-0">
                          {b.doctorId?.name ? b.doctorId.name[0] : "D"}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">{b.doctorId?.name || "Medical Expert"}</h3>
                          <Badge variant="secondary" className="bg-[#2563eb]/10 text-[#2563eb] border-none text-[8.5px] font-bold uppercase tracking-wider capitalize">
                            {b.doctorId?.specialty || "General Medicine"}
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold mt-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-300" />
                            <span>Clinic Wing B, General Hospital</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/50">
                        <div className="text-left md:text-right space-y-0.5">
                          <div className="text-xs font-black text-slate-700 flex items-center gap-1 justify-start md:justify-end">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {(() => {
                              const d = new Date(b.slot || b.slotDate || "");
                              return isNaN(d.getTime()) ? "Scheduled Time" : d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            })()}
                          </div>
                          <p className="text-[9px] text-slate-400">Appointment Slot Time</p>
                        </div>
                        <Badge className="mt-2 bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] capitalize px-2 py-0.5">
                          {b.status || "Confirmed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past/History Appointments */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">Visit History</CardTitle>
              <CardDescription className="text-xs text-slate-400">Overview of completed and cancelled checkups</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-24 bg-slate-50 rounded-xl animate-pulse"></div>
              ) : past.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No consultation history recorded</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {past.map((b) => (
                    <div key={b._id || b.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase shrink-0">
                          {b.doctorId?.name ? b.doctorId.name[0] : "D"}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs">{b.doctorId?.name || "Medical Practitioner"}</h4>
                          <span className="text-[9px] text-slate-400 font-medium block">
                            {(() => {
                              const d = new Date(b.slot || b.slotDate || "");
                              if (isNaN(d.getTime())) return "Scheduled Time";
                              return `${d.toLocaleDateString()} at ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
                            })()}
                          </span>
                        </div>
                      </div>
                      <Badge className={b.status === "Completed" ? "bg-slate-100 text-slate-600 font-bold border-none text-[8.5px] px-2 py-0.5" : "bg-rose-50 text-[#f2052c] font-bold border-none text-[8.5px] px-2 py-0.5"}>
                        {b.status || "Completed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick Doctor Availability list */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">Our Panel Doctors</CardTitle>
              <CardDescription className="text-xs text-slate-400">Consult top rated experts instantly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {doctors.slice(0, 3).map((doc) => (
                <div key={doc._id || doc.id} className="p-4 rounded-xl border border-slate-50 bg-slate-50/50 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#0ea5e9]/10 text-[#2563eb] flex items-center justify-center font-bold text-sm uppercase shrink-0">
                      {doc.name[0]}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      <h4 className="font-extrabold text-xs text-slate-800 truncate">{doc.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium capitalize truncate">{doc.specialty}</p>
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
                    className="w-full text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-50 bg-white shadow-sm"
                    onClick={() => {
                      setOpenBookModal(true);
                      handleDoctorChange(doc._id || doc.id || "");
                    }}
                  >
                    Check Availability
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Book Appointment Dialog */}
      <Dialog open={openBookModal} onOpenChange={setOpenBookModal}>
        <DialogContent className="sm:max-w-md rounded-[20px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#2563eb]" /> Schedule Appointment
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Select a specialized doctor and confirm your preferred time slot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Doctor Selector */}
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700">Choose Specialist *</Label>
              <select
                onChange={(e) => handleDoctorChange(e.target.value)}
                value={selectedDoctor ? (selectedDoctor._id || selectedDoctor.id) : ""}
                className="w-full rounded-xl border border-slate-200 bg-white h-10 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">-- Select Doctor --</option>
                {doctors.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slot Selector */}
            {selectedDoctor && (
              <div className="space-y-2 text-left">
                <Label className="text-xs font-bold text-slate-700">Available Slots *</Label>
                
                {loadingSlots ? (
                  <p className="text-xs text-slate-400 animate-pulse">Retrieving calendar slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-slate-400">No slots available for this doctor.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const timeStr = new Date(slot).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const isSelected = selectedSlot === slot;
                      return (
                        <Button
                          key={slot}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          className={`rounded-xl text-xs px-2 h-9 truncate ${
                            isSelected ? "bg-[#2563eb]" : "border-slate-200 hover:bg-slate-50"
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {timeStr}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpenBookModal(false)}>
                Close
              </Button>
              <Button 
                onClick={handleBookAppointment} 
                className="bg-[#2563eb] text-white font-bold rounded-xl shadow-md"
                disabled={bookingLoading || !selectedDoctor || !selectedSlot}
              >
                {bookingLoading ? "Booking..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Appointments;
