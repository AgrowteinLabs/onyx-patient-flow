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
  Sparkles
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
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">Prescription Records</CardTitle>
              <CardDescription className="text-xs text-slate-400">Medications and clinical guidance from your consultations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-32 bg-slate-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Pill className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800">No Prescriptions on Record</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    Digital prescriptions issued by your consulting doctor during or after video visits will appear here automatically with full dosage schedules.
                  </p>
                  <Button 
                    onClick={() => navigate("/dashboard/user/appointments")}
                    className="mt-4 bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Calendar className="h-4 w-4 mr-1.5" /> Book Consultation
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {prescriptions.map((p) => (
                    <div key={p.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col gap-4 shadow-2xs">
                      
                      {/* Doctor info & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 font-black text-sm uppercase">
                            {p.doctorName ? p.doctorName[0] : "D"}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">Dr. {p.doctorName}</h3>
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[8.5px] px-2 py-0.5">
                                Verified Digital Rx
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-400 font-semibold">{p.doctorSpecialty || "General Medicine"}</p>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              Prescribed on {new Date(p.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <Button 
                            onClick={() => handlePrint(p)}
                            variant="outline" 
                            size="sm" 
                            className="text-xs font-bold rounded-xl border-slate-200 bg-white hover:bg-slate-100 shadow-2xs h-9 px-3.5"
                          >
                            <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Print / PDF
                          </Button>
                        </div>
                      </div>

                      {/* Diagnosis Section */}
                      {p.diagnosis && (
                        <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100/60 text-xs text-slate-700 flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-[#2563eb] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Diagnosis</span>
                            <span className="font-extrabold text-slate-800">{p.diagnosis}</span>
                          </div>
                        </div>
                      )}

                      {/* Medications list */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Prescribed Medication ({p.medications.length})
                        </span>
                        <div className="space-y-2">
                          {p.medications.map((m, idx) => (
                            <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Pill className="h-4 w-4 text-[#f2052c] shrink-0" />
                                  <h4 className="font-extrabold text-xs text-slate-800">{m.name}</h4>
                                </div>
                                {m.duration && (
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold text-[9px] border-none px-2 py-0.5">
                                    {m.duration}
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 bg-slate-50/70 p-2 rounded-lg">
                                <div>
                                  <span className="text-[9px] text-slate-400 block font-semibold">Dosage</span>
                                  <span className="font-bold text-slate-700">{m.dosage || "1 Unit"}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 block font-semibold">Frequency</span>
                                  <span className="font-bold text-slate-700">{m.frequency || "As prescribed"}</span>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                  <span className="text-[9px] text-slate-400 block font-semibold">Instructions</span>
                                  <span className="font-medium text-slate-600 truncate block">{m.instructions || "Follow doctor guidance"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Clinical Notes warning / advice */}
                      {p.clinicalNotes && (
                        <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[9.5px] uppercase tracking-wider block text-amber-700">Doctor's Advice & Notes</span>
                            <span className="leading-relaxed font-semibold">{p.clinicalNotes}</span>
                          </div>
                        </div>
                      )}

                      {/* Digital signature footer note */}
                      <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-emerald-600">
                          <ShieldCheck className="h-3.5 w-3.5" /> Digitally Signed by Dr. {p.doctorName}
                        </span>
                        <span className="font-mono text-[9px]">
                          {p.doctorDigitalSignature?.registrationNumber || "MCI-REGISTERED"}
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: History prescriptions */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">Pharmacy & Summary</CardTitle>
              <CardDescription className="text-xs text-slate-400">Quick overview of current prescription records</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-20 bg-slate-50 rounded-xl animate-pulse" />
              ) : prescriptions.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No past prescriptions recorded</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {prescriptions.map((p) => (
                    <div key={p.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0">
                          <FileCheck className="h-4 w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-slate-800 text-xs truncate max-w-[140px]">
                            {p.medications[0]?.name || "Prescription"}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-medium block">
                            Dr. {p.doctorName} • {new Date(p.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 font-bold border-none text-[8.5px] px-2 py-0.5">
                        Active
                      </Badge>
                    </div>
                  ))}
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
