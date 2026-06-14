import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { listDoctors, getDoctorAvailability, Doctor } from "@/services/doctor.service";
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
  CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";

const Doctors = () => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  // Booking integrations in-place
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [openBookModal, setOpenBookModal] = useState(false);

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

  const handleOpenBooking = async (doc: Doctor) => {
    setBookingDoctor(doc);
    setSelectedSlot("");
    setAvailableSlots([]);
    setOpenBookModal(true);
    setLoadingSlots(true);

    try {
      const docId = doc._id || doc.id || "";
      const slots = await getDoctorAvailability(docId);
      if (!slots || slots.length === 0) {
        setAvailableSlots([]);
      } else {
        setAvailableSlots(slots);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!bookingDoctor || !selectedSlot) return;

    try {
      setBookingLoading(true);
      const profileId = localStorage.getItem("selectedProfileId") || undefined;
      const docId = bookingDoctor._id || bookingDoctor.id || "";

      const response = await createBooking(docId, selectedSlot, profileId);
      const bookingId = response.booking?._id || response.booking?.id || response._id || response.id;
      
      await confirmBooking(bookingId);

      toast({
        title: "Visit Confirmed!",
        description: `Your appointment with ${bookingDoctor.name} is successfully scheduled.`
      });
      setOpenBookModal(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to confirm appointment", variant: "destructive" });
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
                    <Badge variant="secondary" className="bg-[#2563eb]/10 text-[#2563eb] border-none text-[8.5px] font-bold uppercase tracking-wider capitalize px-1.5 py-0.5">
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
        <DialogContent className="sm:max-w-md rounded-[20px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#2563eb]" /> Select Appointment Time
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Confirm your preferred schedule slot with {bookingDoctor?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {loadingSlots ? (
              <p className="text-xs text-slate-400 animate-pulse text-center py-4">Retrieving doctor availability slots...</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No slots available currently.</p>
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

            <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpenBookModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmAppointment} 
                className="bg-[#2563eb] text-white font-bold rounded-xl shadow-md"
                disabled={bookingLoading || !bookingDoctor || !selectedSlot}
              >
                {bookingLoading ? "Scheduling..." : "Book Consult Slot"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Doctors;
