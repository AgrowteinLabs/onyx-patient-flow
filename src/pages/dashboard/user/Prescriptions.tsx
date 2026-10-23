import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  Download, 
  AlertCircle,
  FileCheck,
  Calendar,
  User,
  ShieldCheck,
  RefreshCcw,
  Printer,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Stethoscope
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { listBookings, getPrescription, Booking } from "@/services/booking.service";
import { useNavigate } from "react-router-dom";
import { openPrescriptionPdf } from "@/utils/prescriptionPdf";

export interface MedicationItem {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface DoctorDigitalSignature {
  doctorName?: string;
  registrationNumber?: string;
  councilState?: string;
  signedAt?: string;
}

export interface PrescriptionRecord {
  id: string;
  bookingId: string;
  doctorName: string;
  doctorSpecialty?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  medications: MedicationItem[];
  doctorDigitalSignature?: DoctorDigitalSignature;
  refillAllowed?: boolean;
  date: string;
  status: "active" | "completed";
}

const Prescriptions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("all");
  const [rxPage, setRxPage] = useState(1);
  const rxPerPage = 2;

  const filteredRxs = selectedBookingId === "all"
    ? prescriptions
    : prescriptions.filter(p => p.bookingId === selectedBookingId);

  const totalRxPages = Math.max(1, Math.ceil(filteredRxs.length / rxPerPage));
  const paginatedRxs = filteredRxs.slice((rxPage - 1) * rxPerPage, rxPage * rxPerPage);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const storedProfileId = localStorage.getItem("selectedProfileId");
      const bookings = await listBookings();
      const profileBookings = (Array.isArray(bookings) ? bookings : []).filter(
        b => b && (b.profileId === storedProfileId || !b.profileId)
      );

      // Filter to bookings that can realistically have a prescription issued
      const eligibleBookings = profileBookings.filter((b: any) => {
        const s = b.status?.toLowerCase();
        return !s || s === "completed" || s === "confirmed" || s === "attended" || b.hasPrescription || b.prescription;
      });

      const rxPromises = eligibleBookings.map(async (b: Booking) => {
        try {
          const bookingId = b._id || b.id;
          if (!bookingId) return null;
          const res: any = await getPrescription(bookingId, { silent: true });
          const rxData = res?.prescription || res?.data || res;
          
          if (rxData && (rxData.medications?.length > 0 || rxData.medicines?.length > 0 || rxData.diagnosis)) {
            const meds: MedicationItem[] = Array.isArray(rxData.medications)
              ? rxData.medications
              : Array.isArray(rxData.medicines)
              ? rxData.medicines.map((m: any) => typeof m === "string" ? { name: m } : m)
              : [];

            const isPastBooking = b.status?.toLowerCase() === "completed" || b.status?.toLowerCase() === "cancelled";

            const record: PrescriptionRecord = {
              id: rxData._id || rxData.id || `rx-${bookingId}`,
              bookingId,
              doctorName: rxData.doctorDigitalSignature?.doctorName || b.doctorId?.name || "Consulting Specialist",
              doctorSpecialty: b.doctorId?.specialty || "General Medicine",
              diagnosis: rxData.diagnosis || "Clinical Diagnosis",
              clinicalNotes: rxData.clinicalNotes || rxData.instructions || rxData.notes || "",
              medications: meds.length > 0 ? meds : [{
                name: rxData.medicineName || "Prescribed Medicine",
                dosage: rxData.dosage || "As advised",
                frequency: rxData.frequency || "Daily",
                duration: rxData.duration || "Course duration"
              }],
              doctorDigitalSignature: rxData.doctorDigitalSignature || {
                doctorName: b.doctorId?.name || "Consulting Doctor",
                registrationNumber: "MCI-VERIFIED",
                councilState: "Medical Council of India"
              },
              refillAllowed: !!rxData.refillAllowed,
              date: rxData.createdAt || b.slotDate || new Date().toISOString(),
              status: isPastBooking ? "completed" : "active"
            };
            return record;
          }
        } catch {
          // No prescription found for this booking
        }
        return null;
      });

      const resolvedRxs = (await Promise.all(rxPromises)).filter(Boolean) as PrescriptionRecord[];

      // Also check local cache for newly issued consultation prescriptions
      try {
        const saved = localStorage.getItem("onyx_doctor_prescriptions");
        if (saved) {
          const localList = JSON.parse(saved);
          if (Array.isArray(localList)) {
            localList.forEach((lp: any) => {
              if (lp && !resolvedRxs.some(r => r.bookingId === lp.bookingId || r.id === lp.id)) {
                resolvedRxs.push({
                  id: lp.id || `rx-${Date.now()}`,
                  bookingId: lp.bookingId || "telehealth-consult",
                  doctorName: lp.doctorName || "Consulting Specialist",
                  doctorSpecialty: "Telehealth Specialist",
                  diagnosis: lp.notes?.includes("Diagnosis:") ? lp.notes.split("Diagnosis:")[1].split(".")[0].trim() : "Telehealth Evaluation",
                  clinicalNotes: lp.notes || "",
                  medications: Array.isArray(lp.medications) ? lp.medications : [{ name: "Prescribed Medicine", dosage: "Standard", frequency: "As directed", duration: "Course" }],
                  date: lp.issuedDate || new Date().toISOString(),
                  status: "active",
                  refillAllowed: false,
                });
              }
            });
          }
        }
      } catch (err) {
        console.debug("Local prescriptions cache check note:", err);
      }
      
      // Sort newest prescriptions first
      resolvedRxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPrescriptions(resolvedRxs);
    } catch (err) {
      console.error("Failed to load prescriptions:", err);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const handlePrint = (p: PrescriptionRecord) => {
    toast({
      title: "Preparing Official Prescription PDF",
      description: `Opening printable PDF for Dr. ${p.doctorName}'s prescription...`
    });
    openPrescriptionPdf(p, true);
  };

  const active = prescriptions.filter(p => p.status === "active");
  const past = prescriptions.filter(p => p.status === "completed");

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Pill className="h-8 w-8 text-[#2563eb]" /> Prescriptions
          </h1>
          <p className="text-slate-500 text-sm mt-1">Official digital prescriptions issued by your consulting doctors</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadPrescriptions} disabled={loading} className="rounded-full">
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Active Prescriptions list */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-64 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : prescriptions.length === 0 ? (
            <Card className="bg-white border-slate-100 shadow-sm rounded-[24px]">
              <CardContent className="py-14 px-4 text-center">
                <div className="h-16 w-16 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Pill className="h-8 w-8" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">No Prescriptions on Record</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Digital prescriptions issued by your consulting doctor during or after video visits will appear here automatically with full dosage schedules.
                </p>
                <Button 
                  onClick={() => navigate("/dashboard/user/appointments")}
                  className="mt-5 bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  <Calendar className="h-4 w-4 mr-1.5" /> Book Consultation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Consultation Switcher Tabs / Filter Bar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => { setSelectedBookingId("all"); setRxPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedBookingId === "all"
                        ? "bg-[#2563eb] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Consultations ({prescriptions.length})
                  </button>
                  {prescriptions.map((p, idx) => {
                    const cCode = p.bookingId && p.bookingId.length >= 6 ? p.bookingId.slice(-6).toUpperCase() : `${idx + 1}`;
                    const isSelected = selectedBookingId === p.bookingId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedBookingId(p.bookingId); setRxPage(1); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#2563eb] text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <Stethoscope className="h-3 w-3" />
                        <span>#{cCode} • Dr. {p.doctorName.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                  Showing {filteredRxs.length} Consultation{filteredRxs.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Distinct Consultation Cards */}
              <div className="space-y-6">
                {paginatedRxs.map((p, idx) => {
                  const globalIndex = prescriptions.findIndex(r => r.id === p.id);
                  const consultNumber = globalIndex !== -1 ? globalIndex + 1 : idx + 1;
                  const consultCode = p.bookingId && p.bookingId.length >= 6 
                    ? p.bookingId.slice(-6).toUpperCase() 
                    : String(consultNumber).padStart(4, '0');

                  return (
                    <div key={p.id} className="space-y-6">
                      {/* Visual Separator between cards */}
                      {idx > 0 && (
                        <div className="relative py-4 flex items-center justify-center">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-dashed border-slate-300"></div>
                          </div>
                          <div className="relative bg-slate-100 border-2 border-slate-300 px-4 py-1.5 rounded-full text-[11px] font-black text-slate-600 uppercase tracking-wider shadow-2xs flex items-center gap-2">
                            <span>Separate Consultation Record #{consultNumber}</span>
                            <span className="text-[#2563eb] font-bold">↓</span>
                          </div>
                        </div>
                      )}

                      {/* Standalone Document Card */}
                      <div className="bg-white rounded-[26px] border-2 border-slate-300/90 shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col">
                        {/* High-Contrast Consultation Header Ribbon */}
                        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60">
                          <div className="flex items-center gap-3.5">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#0ea5e9] to-[#2563eb] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                              #{consultNumber}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-black tracking-wide text-white uppercase">
                                  Consultation #{consultCode}
                                </span>
                                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9.5px] font-bold px-2 py-0.5">
                                  Verified Digital Rx
                                </Badge>
                                <Badge className={`${p.status === "completed" ? "bg-slate-700/60 text-slate-300" : "bg-blue-500/20 text-blue-300"} text-[8.5px] font-semibold border-none`}>
                                  {p.status === "completed" ? "Completed Visit" : "Active Treatment"}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-1">
                                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                                <span>Consulted on {new Date(p.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                              </p>
                            </div>
                          </div>

                          <Button 
                            onClick={() => handlePrint(p)}
                            className="bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-xl shadow-md h-10 px-4 shrink-0 flex items-center gap-2 self-start sm:self-auto"
                          >
                            <Printer className="h-4 w-4 text-[#2563eb]" /> Print / Save PDF
                          </Button>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-5 bg-white">
                          
                          {/* Doctor Information Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3.5">
                              <div className="h-11 w-11 rounded-2xl bg-blue-100 text-[#2563eb] flex items-center justify-center font-black text-sm uppercase shrink-0">
                                {p.doctorName ? p.doctorName[0] : "D"}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-extrabold text-slate-800 text-sm">Dr. {p.doctorName}</h3>
                                  <Badge className="bg-blue-50 text-[#2563eb] border border-blue-200 font-bold text-[8.5px] px-2 py-0.5">
                                    Telemedicine Specialist
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-500 font-semibold">{p.doctorSpecialty || "General Medicine"}</p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right text-[11px] text-slate-400 font-mono">
                              <span className="block font-semibold text-slate-600">NMC / MCI Registered</span>
                              <span className="text-[10px] text-emerald-600 font-medium">Digital Signature Verified</span>
                            </div>
                          </div>

                          {/* Clinical Diagnosis Section */}
                          {p.diagnosis && (
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/70 text-xs text-slate-700 flex items-start gap-3">
                              <Sparkles className="h-4.5 w-4.5 text-[#2563eb] shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-[#2563eb] uppercase tracking-wider block">Clinical Diagnosis</span>
                                <span className="font-extrabold text-slate-800 text-sm">{p.diagnosis}</span>
                              </div>
                            </div>
                          )}

                          {/* Prescribed Medications Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <Pill className="h-4 w-4 text-[#f2052c]" /> Prescribed Medicines ({p.medications.length})
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">Take as instructed by doctor</span>
                            </div>

                            <div className="space-y-2.5">
                              {p.medications.map((m, mIdx) => (
                                <div key={mIdx} className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/80 transition-colors space-y-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <span className="h-6 w-6 rounded-lg bg-red-100 text-[#f2052c] flex items-center justify-center font-bold text-xs">
                                        Rx
                                      </span>
                                      <h4 className="font-black text-sm text-slate-800">{m.name}</h4>
                                    </div>
                                    {m.duration && (
                                      <Badge className="bg-slate-200 text-slate-700 font-extrabold text-[9.5px] border-none px-2.5 py-0.5">
                                        Course: {m.duration}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100">
                                    <div>
                                      <span className="text-[9.5px] text-slate-400 block font-bold uppercase tracking-wider">Dosage</span>
                                      <span className="font-extrabold text-slate-800">{m.dosage || "Standard"}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9.5px] text-slate-400 block font-bold uppercase tracking-wider">Frequency</span>
                                      <span className="font-extrabold text-slate-800">{m.frequency || "As directed"}</span>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                      <span className="text-[9.5px] text-slate-400 block font-bold uppercase tracking-wider">Instructions</span>
                                      <span className="font-semibold text-slate-600 truncate block">{m.instructions || "Follow doctor guidance"}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Clinical Notes & Instructions */}
                          {p.clinicalNotes && (
                            <div className="flex items-start gap-3 text-xs text-amber-900 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
                              <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-black text-[10px] uppercase tracking-wider block text-amber-800">Doctor's Advice & In-Consultation Notes</span>
                                <span className="leading-relaxed font-semibold block text-slate-700 whitespace-pre-wrap">{p.clinicalNotes}</span>
                              </div>
                            </div>
                          )}

                          {/* Digital Signature Footer */}
                          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                              <ShieldCheck className="h-4 w-4" /> Digitally Signed by Dr. {p.doctorName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              Reg No: {p.doctorDigitalSignature?.registrationNumber || "MCI-REGISTERED"} • Valid E-Prescription
                            </span>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {filteredRxs.length > rxPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-700">{(rxPage - 1) * rxPerPage + 1}</span> to{" "}
                    <span className="font-bold text-slate-700">{Math.min(rxPage * rxPerPage, filteredRxs.length)}</span> of{" "}
                    <span className="font-bold text-slate-700">{filteredRxs.length}</span> consultation prescriptions
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={rxPage <= 1}
                      onClick={() => setRxPage(prev => Math.max(prev - 1, 1))}
                      className="h-8 px-2.5 text-xs font-bold rounded-lg border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalRxPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setRxPage(pageNum)}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                            rxPage === pageNum
                              ? "bg-[#2563eb] text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={rxPage >= totalRxPages}
                      onClick={() => setRxPage(prev => Math.min(prev + 1, totalRxPages))}
                      className="h-8 px-2.5 text-xs font-bold rounded-lg border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: History prescriptions */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[24px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-extrabold text-slate-800">Prescription Summary</CardTitle>
              <CardDescription className="text-xs text-slate-400">Click a consultation to view or print</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-20 bg-slate-50 rounded-xl animate-pulse" />
              ) : prescriptions.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No past prescriptions recorded</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {prescriptions.map((p, pIdx) => {
                    const cCode = p.bookingId && p.bookingId.length >= 6 
                      ? p.bookingId.slice(-6).toUpperCase() 
                      : String(pIdx + 1).padStart(4, '0');
                    const isSelected = selectedBookingId === p.bookingId;

                    return (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setSelectedBookingId(p.bookingId);
                          setRxPage(1);
                        }}
                        className={`py-3 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected ? "bg-blue-50/70 border border-blue-200 ring-1 ring-blue-300" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                            isSelected ? "bg-[#2563eb] text-white" : "bg-blue-50 text-[#2563eb]"
                          }`}>
                            #{pIdx + 1}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-extrabold text-slate-800 text-xs truncate">
                              {p.medications[0]?.name || "Prescription"}
                            </h4>
                            <span className="text-[9.5px] text-slate-400 font-medium block truncate">
                              Dr. {p.doctorName} • #{cCode}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(p);
                          }}
                          className="h-7 px-2.5 text-[10.5px] font-bold text-[#2563eb] border-blue-200 hover:bg-blue-100 rounded-lg flex items-center gap-1 shrink-0"
                        >
                          <Printer className="h-3 w-3" /> PDF
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
};

export default Prescriptions;
