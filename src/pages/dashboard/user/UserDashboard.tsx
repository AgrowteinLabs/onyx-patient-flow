import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  FileText, 
  Video, 
  Stethoscope, 
  Calendar, 
  Activity, 
  User, 
  Users, 
  Plus, 
  Pill, 
  Clock, 
  ChevronRight, 
  MapPin, 
  Phone, 
  CheckCircle,
  FileCheck,
  Download,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Printer,
  Eye,
  ArrowRight
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProfiles, Profile } from "@/services/profile.service";
import { listBookings, getPrescription, Booking } from "@/services/booking.service";
import { listReportsByProfile } from "@/services/report.service";
import { listSessions, Session } from "@/services/session.service";
import { getBookingLifecycle } from "@/utils/booking-lifecycle";
import { presenceService } from "@/services/presence.service";
import { openPrescriptionPdf } from "@/utils/prescriptionPdf";
import { useToast } from "@/hooks/use-toast";

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMainDashboard = location.pathname === "/dashboard/user" || location.pathname === "/dashboard/user/";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    localStorage.getItem("selectedProfileId")
  );
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  // Helper to extract string profile ID from booking.profileId (which may be a string or a populated object)
  const getBookingProfileId = (b: any): string | undefined => {
    if (!b || !b.profileId) return undefined;
    if (typeof b.profileId === "string") return b.profileId;
    return b.profileId._id || b.profileId.id || undefined;
  };

  // Load profiles from backend
  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const profileList = await getProfiles();
      const profilesArr = Array.isArray(profileList) ? profileList : [];
      setProfiles(profilesArr);

      const storedId = localStorage.getItem("selectedProfileId");
      if (storedId && profilesArr.length > 0) {
        setSelectedProfileId(storedId);
        const active = profilesArr.find(p => p._id === storedId || p.id === storedId);
        if (active) {
          setActiveProfile(active);
        } else {
          setActiveProfile(profilesArr[0]);
          const firstId = profilesArr[0]._id || profilesArr[0].id || "";
          localStorage.setItem("selectedProfileId", firstId);
          setSelectedProfileId(firstId);
        }
      }
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load dashboard clinical data for the active profile
  const loadDashboardData = useCallback(async (profileId: string) => {
    try {
      setRefreshing(true);
      const [bookingsList, reportsList, sessionsList] = await Promise.allSettled([
        listBookings(),
        listReportsByProfile(profileId),
        listSessions()
      ]);

      let loadedBookings: Booking[] = [];
      if (bookingsList.status === "fulfilled") {
        const val = bookingsList.value;
        const allBookings = Array.isArray(val) ? val : [];
        loadedBookings = allBookings.filter(b => {
          if (!b) return false;
          const bPid = getBookingProfileId(b);
          return bPid === profileId || !bPid;
        });
        setBookings(loadedBookings);

        // Fetch genuine digital prescriptions for user's eligible bookings
        const rxList: any[] = [];
        const eligibleBookings = loadedBookings.filter((b: any) => {
          const s = (b.status || "").toLowerCase();
          return s === "completed" || s === "confirmed" || s === "in_consultation" || s === "in progress" || b.hasPrescription || b.prescription;
        });

        await Promise.all(
          eligibleBookings.slice(0, 8).map(async (b) => {
            try {
              const bookingId = b._id || b.id;
              if (!bookingId) return;
              const res: any = await getPrescription(bookingId, { silent: true });
              const rxData = res?.prescription || res?.data || res;
              if (rxData && (rxData.medications?.length > 0 || rxData.medicines?.length > 0 || rxData.diagnosis)) {
                const med = rxData.medications?.[0] || (typeof rxData.medicines?.[0] === "string" ? { name: rxData.medicines[0] } : rxData.medicines?.[0]);
                rxList.push({
                  id: rxData._id || rxData.id || bookingId,
                  bookingId,
                  medicine: med?.name || rxData.diagnosis || "Prescription Record",
                  dosage: med?.dosage || "As advised",
                  duration: med?.duration || rxData.duration || "Course",
                  frequency: med?.frequency || "Daily",
                  doctor: rxData.doctorDigitalSignature?.doctorName || b.doctorId?.name || "Consulting Specialist",
                  doctorSpecialty: b.doctorId?.specialty || "General Medicine",
                  diagnosis: rxData.diagnosis || "Telehealth Consultation",
                  date: rxData.createdAt || b.slotDate || b.createdAt || new Date().toISOString(),
                  raw: rxData,
                  booking: b,
                });
              }
            } catch {
              // No prescription issued yet on this booking
            }
          })
        );

        // Also merge any recently issued local prescriptions from current session
        try {
          const saved = localStorage.getItem("onyx_doctor_prescriptions");
          if (saved) {
            const localList = JSON.parse(saved);
            if (Array.isArray(localList)) {
              localList.forEach((lp: any) => {
                if (lp && !rxList.some(r => r.bookingId === lp.bookingId || r.id === lp.id)) {
                  rxList.push({
                    id: lp.id || `rx-${Date.now()}`,
                    bookingId: lp.bookingId || "telehealth-consult",
                    medicine: lp.medications?.[0]?.name || "Prescribed Medicine",
                    dosage: lp.medications?.[0]?.dosage || "Standard",
                    duration: lp.medications?.[0]?.duration || "Course",
                    frequency: lp.medications?.[0]?.frequency || "Daily",
                    doctor: lp.doctorName || "Consulting Specialist",
                    doctorSpecialty: "Telehealth Specialist",
                    diagnosis: lp.notes?.includes("Diagnosis:") ? lp.notes.split("Diagnosis:")[1].split(".")[0].trim() : "Telehealth Evaluation",
                    date: lp.issuedDate || new Date().toISOString(),
                    raw: lp,
                  });
                }
              });
            }
          }
        } catch (e) {
          console.debug("Local prescriptions cache check note:", e);
        }

        // Sort newest first
        rxList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPrescriptions(rxList);
      }

      let loadedReports: any[] = [];
      if (reportsList.status === "fulfilled") {
        const val = reportsList.value;
        loadedReports = Array.isArray(val) ? val.filter(Boolean) : [];
        setReports(loadedReports);
      }

      if (sessionsList.status === "fulfilled") {
        const val = sessionsList.value;
        setSessions(Array.isArray(val) ? val.filter(Boolean) : []);
      }

      // Compute dynamic last sync time
      const latestTimestamp = loadedReports[0]?.createdAt || loadedBookings[0]?.createdAt;
      if (latestTimestamp) {
        const syncDate = new Date(latestTimestamp);
        const isToday = syncDate.toDateString() === new Date().toDateString();
        const timePart = syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(isToday ? `Today, ${timePart}` : `${syncDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timePart}`);
      } else {
        setLastSyncTime(`Live Synced · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    if (selectedProfileId && isMainDashboard) {
      loadDashboardData(selectedProfileId);
    }
  }, [selectedProfileId, isMainDashboard, loadDashboardData]);

  // Real-time synchronization listeners (Presence WebSocket and BroadcastChannel)
  useEffect(() => {
    const handleRefresh = () => {
      if (selectedProfileId) loadDashboardData(selectedProfileId);
    };

    const unbindStatus = presenceService.on("booking:status", handleRefresh);
    const unbindEnded = presenceService.on("consultation:ended", handleRefresh);
    const unbindAdmitted = presenceService.on("patient-admitted", (data) => {
      handleRefresh();
      toast({
        title: "Doctor Admitted You",
        description: "Your consultation is ready. You can join the room now.",
      });
    });

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("onyx-telehealth-session");
        bc.onmessage = () => {
          handleRefresh();
        };
      }
    } catch {}

    window.addEventListener("onyx:refresh_dashboard", handleRefresh);

    return () => {
      unbindStatus();
      unbindEnded();
      unbindAdmitted();
      if (bc) {
        try { bc.close(); } catch {}
      }
      window.removeEventListener("onyx:refresh_dashboard", handleRefresh);
    };
  }, [selectedProfileId, loadDashboardData, toast]);

  const selectProfile = (profile: Profile) => {
    const id = profile._id || profile.id || "";
    localStorage.setItem("selectedProfileId", id);
    setSelectedProfileId(id);
    setActiveProfile(profile);
    toast({
      title: "Active Profile Selected",
      description: `Viewing medical records and consultations for ${profile.name}`,
    });
  };

  const handleSwitchProfile = () => {
    localStorage.removeItem("selectedProfileId");
    setSelectedProfileId(null);
    setActiveProfile(null);
  };

  // Determine Live / Active Consultation for high-priority notification banner
  const activeLiveBooking = useMemo(() => {
    return bookings.find((b) => {
      const { category } = getBookingLifecycle(b);
      const rawStatus = (b.status || "").toLowerCase();
      return (
        category === "ready" ||
        rawStatus === "in_consultation" ||
        rawStatus === "in_progress" ||
        rawStatus === "calling"
      );
    }) || null;
  }, [bookings]);

  // Determine Statistics
  const upcomingAppointments = useMemo(() => {
    return bookings.filter(b => {
      const { isPast, category } = getBookingLifecycle(b);
      return !isPast && category !== "completed" && category !== "cancelled";
    });
  }, [bookings]);

  const completedConsultations = useMemo(() => {
    return bookings.filter(b => {
      const { category } = getBookingLifecycle(b);
      const raw = (b.status || "").toLowerCase();
      return category === "completed" || raw === "completed" || raw === "attended";
    });
  }, [bookings]);

  const reportsCount = reports.filter(Boolean).length;

  // Open official prescription printable PDF
  const handleOpenRxPdf = (rx: any) => {
    try {
      openPrescriptionPdf(rx.raw || rx, true);
    } catch (err) {
      console.warn("Could not open prescription PDF directly:", err);
      toast({
        title: "Prescription View",
        description: `Prescribed by Dr. ${rx.doctor}: ${rx.medicine} (${rx.dosage})`,
      });
    }
  };

  // Open report file link
  const handleOpenReport = (report: any) => {
    const fileUrl = report.s3Link || report.fileUrl || report.url || report.downloadUrl;
    if (fileUrl) {
      window.open(fileUrl, "_blank");
      toast({ title: "Opening Diagnostic Report...", description: report.reportCode || "Report File" });
    } else {
      toast({
        title: "Report Download Unavailable",
        description: "The file link has expired or is being generated by the lab.",
        variant: "destructive"
      });
    }
  };

  // Render Profile Selection Screen if no profile selected
  if (!selectedProfileId && isMainDashboard) {
    return (
      <div className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4 bg-gradient-to-tr from-sky-50 via-slate-50 to-indigo-50 rounded-[24px] shadow-sm relative overflow-hidden">
        {/* Glow Blobs */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#0ea5e9]/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-[#2563eb]/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl w-full text-center z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 bg-gradient-to-tr from-[#0ea5e9] to-[#2563eb] rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Who is visiting today?</h2>
            <p className="text-slate-500 text-sm mt-1">Select a verified patient profile to enter your personal health portal</p>
          </div>

          {loading ? (
            <div className="flex justify-center gap-6 mt-8">
              {[1, 2].map((i) => (
                <div key={i} className="w-52 h-64 bg-white rounded-[20px] shadow-sm animate-pulse border border-slate-100"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center max-w-3xl mx-auto">
              {profiles.map((profile) => (
                <Card 
                  key={profile._id || profile.id}
                  className="bg-white border border-slate-100 hover:border-[#0ea5e9] hover:shadow-xl hover:scale-102 cursor-pointer transition-all duration-300 rounded-[20px] p-6 text-center flex flex-col items-center justify-between"
                  onClick={() => selectProfile(profile)}
                >
                  <div className="space-y-4">
                    <div className="h-20 w-20 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-[#2563eb] font-bold text-2xl shadow-sm uppercase">
                      {profile.name ? profile.name[0] : "P"}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{profile.name}</h3>
                      <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-600 border-none capitalize">
                        {profile.isMain ? "Primary Profile" : "Family Member"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-6 w-full text-xs text-slate-400 border-t pt-4 space-y-1">
                    <p>Age: <span className="font-bold text-slate-600">{profile.age || (profile.dob ? `${new Date().getFullYear() - new Date(profile.dob).getFullYear()}` : "--")} yrs</span></p>
                    <p>Gender: <span className="font-bold text-slate-600 capitalize">{profile.gender || "Not specified"}</span></p>
                  </div>
                </Card>
              ))}

              {/* Add New Profile Card */}
              <Card 
                className="bg-white/40 border border-dashed border-slate-200 hover:border-[#0ea5e9] hover:bg-white cursor-pointer transition-all rounded-[20px] p-6 text-center flex flex-col items-center justify-center h-full min-h-[220px]"
                onClick={() => navigate("/dashboard/user/profiles")}
              >
                <div className="h-12 w-12 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-700 text-sm">Add Family Member</h3>
                <p className="text-slate-400 text-xs mt-1">Link another patient account</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compute profile contact phone safely
  const profileContactPhone = (() => {
    if (!activeProfile) return "Not provided";
    if (Array.isArray(activeProfile.phone_number) && activeProfile.phone_number.length > 0) {
      return `+${activeProfile.phone_number.join(" ")}`;
    }
    if (activeProfile.phone) return activeProfile.phone;
    const storedPhone = localStorage.getItem("userPhone");
    if (storedPhone) return storedPhone;
    return "Not provided";
  })();

  const profileBloodGroup = activeProfile?.blood_group || activeProfile?.bloodGroup || "Not specified";
  const profilePatientCode = activeProfile?.patientCode || (activeProfile?._id ? `#${activeProfile._id.slice(-6).toUpperCase()}` : "PH-VERIFIED");

  return (
    <DashboardLayout>
      {isMainDashboard && activeProfile ? (
        <div className="space-y-8 animate-fadeIn font-sans pb-12">

          {/* ============================================================
              HIGH-PRIORITY ACTIVE / IN-PROGRESS VIDEO CONSULTATION BANNER
          ============================================================ */}
          {activeLiveBooking && (
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 p-1 shadow-2xl shadow-emerald-500/20 animate-pulse">
              <div className="rounded-[22px] bg-[#14213D] p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shrink-0">
                    <Video className="h-7 w-7 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-white" /> LIVE CONSULTATION ACTIVE NOW
                      </span>
                      <span className="text-xs text-emerald-300 font-bold">Encrypted Agora HD Telehealth</span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-1">
                      Dr. {activeLiveBooking.doctorId?.name || "Consulting Specialist"}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      {activeLiveBooking.doctorId?.specialty || "General Medicine"} • {activeLiveBooking.condition || activeLiveBooking.reason || "Telehealth Consultation"} · Status:{" "}
                      <span className="text-emerald-300 font-bold uppercase">{activeLiveBooking.status || "Ready"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() =>
                      navigate(
                        `/dashboard/user/consultations?bookingId=${activeLiveBooking._id || activeLiveBooking.id}&autoJoin=true`
                      )
                    }
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-[16px] h-12 px-6 text-xs shadow-xl flex items-center gap-2 border-none transform hover:scale-105 transition-all"
                  >
                    <Video className="h-4.5 w-4.5" /> JOIN VIDEO ROOM NOW
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* ============================================================
              SECTION 1: WELCOME BANNER + PROFILE SUMMARY
          ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Welcome Banner */}
            <div className="lg:col-span-8 bg-gradient-to-r from-[#0ea5e9] via-[#1d4ed8] to-[#2563eb] rounded-[24px] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
              {/* Decorative background shapes */}
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
              <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="space-y-2.5 z-10 relative">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-md border border-white/20 text-white">
                    <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
                    Patient Telehealth Portal
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Welcome Back, {activeProfile.name} 👋</h2>
                <p className="text-white/80 text-sm max-w-lg leading-relaxed">
                  Everything you need to consult doctors via HD video, manage diagnostic lab reports, track digital prescriptions, and schedule clinic visits.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 z-10 relative">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-bold border border-white/15">
                    Patient ID: <span className="font-extrabold font-mono">{profilePatientCode}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-bold border border-white/15 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Last Sync: <span className="font-extrabold">{lastSyncTime || "Real-Time Synced"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSwitchProfile}
                    className="rounded-xl bg-white/15 hover:bg-white/25 border-white/20 text-white text-xs font-bold h-9 px-3.5 backdrop-blur-md"
                  >
                    <Users className="h-3.5 w-3.5 mr-1.5" /> Switch Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => selectedProfileId && loadDashboardData(selectedProfileId)}
                    disabled={refreshing}
                    className="rounded-xl bg-white/15 hover:bg-white/25 border-white/20 text-white h-9 w-9 backdrop-blur-md"
                    title="Refresh Live Data"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Profile Summary Card */}
            <Card className="lg:col-span-4 bg-white border border-slate-100 shadow-md rounded-[24px] overflow-hidden flex flex-col justify-between">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-[#2563eb] text-white flex items-center justify-center font-black text-sm uppercase shadow-sm">
                      {activeProfile.name ? activeProfile.name[0] : "P"}
                    </div>
                    <div>
                      <CardTitle className="text-base font-extrabold text-slate-800">{activeProfile.name}</CardTitle>
                      <CardDescription className="text-[10px] uppercase font-bold text-[#0ea5e9]">
                        {activeProfile.isMain ? "Primary Account Holder" : "Linked Family Member"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 flex-1 flex flex-col justify-center space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-medium">Age</span>
                    <span className="font-extrabold text-slate-700">
                      {activeProfile.age ? `${activeProfile.age} Years` : (activeProfile.dob ? `${new Date().getFullYear() - new Date(activeProfile.dob).getFullYear()} Years` : "Not specified")}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-medium">Gender</span>
                    <span className="font-extrabold text-slate-700 capitalize">{activeProfile.gender || "Not specified"}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-medium">Blood Group</span>
                    <span className="font-extrabold text-[#e11d48] font-mono">{profileBloodGroup}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-medium">Contact</span>
                    <span className="font-bold text-slate-700 truncate block font-mono">
                      {profileContactPhone}
                    </span>
                  </div>
                </div>

                {/* ABDM / ABHA Health ID Status */}
                {(activeProfile.abhaAddress || activeProfile.abhaNumber || activeProfile.isAbhaLinked) ? (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">National Health ID:</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      {activeProfile.abhaAddress || activeProfile.abhaNumber || "ABHA Verified"}
                    </Badge>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">ABDM Health ID:</span>
                    <button
                      onClick={() => navigate("/dashboard/user/profiles")}
                      className="text-[11px] font-bold text-[#0ea5e9] hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Link ABHA ID
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ============================================================
              SECTION 2: QUICK ACTION CARDS
          ============================================================ */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0ea5e9]" /> Quick Health Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Action 1: Book Appointment */}
              <button 
                onClick={() => navigate("/dashboard/user/appointments")}
                className="bg-white border border-slate-100 hover:border-[#0ea5e9] shadow-sm hover:shadow-lg p-5 rounded-[20px] text-left transition-all duration-300 flex items-center justify-between group"
              >
                <div className="space-y-2">
                  <div className="h-11 w-11 rounded-2xl bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-[#0ea5e9] transition-colors">Book Appointment</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">Schedule clinic or telehealth visit</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#0ea5e9] group-hover:translate-x-1 transition-all" />
              </button>

              {/* Action 2: View Reports */}
              <button 
                onClick={() => navigate("/dashboard/user/reports")}
                className="bg-white border border-slate-100 hover:border-[#2563eb] shadow-sm hover:shadow-lg p-5 rounded-[20px] text-left transition-all duration-300 flex items-center justify-between group"
              >
                <div className="space-y-2">
                  <div className="h-11 w-11 rounded-2xl bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-[#2563eb] transition-colors">Diagnostic Reports</h4>
                      {reportsCount > 0 && (
                        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full">
                          {reportsCount}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">Access lab results & scan reports</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#2563eb] group-hover:translate-x-1 transition-all" />
              </button>

              {/* Action 3: Prescriptions */}
              <button 
                onClick={() => navigate("/dashboard/user/prescriptions")}
                className="bg-white border border-slate-100 hover:border-emerald-500 shadow-sm hover:shadow-lg p-5 rounded-[20px] text-left transition-all duration-300 flex items-center justify-between group"
              >
                <div className="space-y-2">
                  <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">Prescriptions</h4>
                      {prescriptions.length > 0 && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full">
                          {prescriptions.length}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">Digital slips & ongoing medicines</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Action 4: Instant Video Consultation */}
              <button 
                onClick={() => navigate("/dashboard/user/consultations")}
                className="bg-white border border-slate-100 hover:border-indigo-500 shadow-sm hover:shadow-lg p-5 rounded-[20px] text-left transition-all duration-300 flex items-center justify-between group"
              >
                <div className="space-y-2">
                  <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">Video Consultation</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">Instant triage & waiting room</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </button>

            </div>
          </div>

          {/* ============================================================
              SECTION 3: REAL-TIME STATISTICS CARDS
          ============================================================ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Stat 1: Upcoming Appointments */}
            <Card 
              onClick={() => navigate("/dashboard/user/appointments")}
              className="bg-white border border-slate-100 shadow-sm hover:shadow-md rounded-[20px] p-5 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Appointments</span>
                <Badge className="bg-sky-50 text-[#0ea5e9] border-none font-bold text-[10px]">Upcoming</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">{upcomingAppointments.length}</h3>
                <p className="text-slate-400 text-[10px] mt-0.5 font-medium">Scheduled bookings</p>
              </div>
            </Card>

            {/* Stat 2: Completed Consultations */}
            <Card 
              onClick={() => navigate("/dashboard/user/consultations")}
              className="bg-white border border-slate-100 shadow-sm hover:shadow-md rounded-[20px] p-5 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Consultations</span>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px]">Completed</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">{completedConsultations.length}</h3>
                <p className="text-slate-400 text-[10px] mt-0.5 font-medium">Attended sessions</p>
              </div>
            </Card>

            {/* Stat 3: Reports Available */}
            <Card 
              onClick={() => navigate("/dashboard/user/reports")}
              className="bg-white border border-slate-100 shadow-sm hover:shadow-md rounded-[20px] p-5 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reports</span>
                <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[10px]">Active</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">{reportsCount}</h3>
                <p className="text-slate-400 text-[10px] mt-0.5 font-medium">Diagnostic lab files</p>
              </div>
            </Card>

            {/* Stat 4: Active Prescriptions */}
            <Card 
              onClick={() => navigate("/dashboard/user/prescriptions")}
              className="bg-white border border-slate-100 shadow-sm hover:shadow-md rounded-[20px] p-5 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Prescriptions</span>
                <Badge className="bg-rose-50 text-[#f2052c] border-none font-bold text-[10px]">Active</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">{prescriptions.length}</h3>
                <p className="text-slate-400 text-[10px] mt-0.5 font-medium">Signed digital prescriptions</p>
              </div>
            </Card>

          </div>

          {/* ============================================================
              MIDDLE LAYOUT: LEFT (APPOINTMENTS & PRESCRIPTIONS) & RIGHT (REPORTS & CONSULTATIONS)
          ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (7 cols): Section 4 Upcoming Appointments & Section 6 Active Prescriptions */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* SECTION 4: UPCOMING APPOINTMENTS */}
              <Card className="bg-white border border-slate-100 shadow-md rounded-[24px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/50 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#0ea5e9]" /> Upcoming Appointments
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">Scheduled visits with consulting specialists</CardDescription>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-[#2563eb] font-bold text-xs"
                    onClick={() => navigate("/dashboard/user/appointments")}
                  >
                    View All ({upcomingAppointments.length})
                  </Button>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      <Calendar className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-bold">No upcoming appointments scheduled</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Book a live video call or clinic visit with a specialist</p>
                      <Button 
                        size="sm" 
                        className="mt-4 bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] text-white rounded-xl text-xs font-bold"
                        onClick={() => navigate("/dashboard/user/appointments")}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Book New Appointment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.slice(0, 3).map((booking) => {
                        const lifecycle = getBookingLifecycle(booking);
                        const canJoin = lifecycle.category === "ready" || booking.status === "in_consultation" || booking.status === "confirmed";

                        return (
                          <div 
                            key={booking._id || booking.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[18px] bg-slate-50/80 hover:bg-slate-50 border border-slate-100 transition-all"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="h-11 w-11 rounded-[14px] bg-gradient-to-tr from-[#0ea5e9] to-[#2563eb] flex items-center justify-center text-white font-black text-sm uppercase shadow-xs shrink-0">
                                {booking.doctorId?.name ? booking.doctorId.name[0] : "D"}
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <h4 className="font-extrabold text-slate-800 text-sm truncate">
                                  {booking.doctorId?.name ? (booking.doctorId.name.toLowerCase().startsWith("dr") ? booking.doctorId.name : `Dr. ${booking.doctorId.name}`) : "Consulting Doctor"}
                                </h4>
                                <p className="text-xs text-slate-500 font-medium capitalize truncate">
                                  {booking.doctorId?.specialty || "General Telehealth"} • {booking.type === "instant" ? "Instant Call" : "Scheduled"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <div className="text-left sm:text-right">
                                <Badge className={`${lifecycle.badgeClass} font-bold text-[9px] mb-1 block`}>
                                  {lifecycle.label}
                                </Badge>
                                <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 font-mono">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  {lifecycle.formattedTime}
                                </div>
                              </div>

                              {canJoin ? (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/dashboard/user/consultations?bookingId=${booking._id || booking.id}&autoJoin=true`
                                    )
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 px-3 text-xs font-bold flex items-center gap-1 shadow-sm"
                                >
                                  <Video className="h-3.5 w-3.5" /> Join Room
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate("/dashboard/user/appointments")}
                                  className="rounded-xl h-8 text-xs font-bold border-slate-200 text-slate-600 hover:bg-white"
                                >
                                  Details
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SECTION 6: ACTIVE PRESCRIPTIONS */}
              <Card className="bg-white border border-slate-100 shadow-md rounded-[24px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/50 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Pill className="h-4 w-4 text-emerald-600" /> Active Prescriptions
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">Doctor issued medication courses and dosages</CardDescription>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-[#2563eb] font-bold text-xs"
                    onClick={() => navigate("/dashboard/user/prescriptions")}
                  >
                    View All ({prescriptions.length})
                  </Button>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      <Pill className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-bold">No active prescriptions on record</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Prescriptions issued by your doctor after video consults will appear here</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="mt-4 text-xs font-bold border-slate-200 text-[#2563eb] rounded-xl"
                        onClick={() => navigate("/dashboard/user/consultations")}
                      >
                        Start Consultation
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {prescriptions.slice(0, 4).map((p: any) => (
                        <div 
                          key={p.id} 
                          onClick={() => handleOpenRxPdf(p)}
                          className="p-4 rounded-[18px] border border-slate-100 bg-slate-50/80 hover:bg-slate-100/70 hover:border-emerald-200 cursor-pointer transition-all flex items-start gap-3.5 group"
                        >
                          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Pill className="h-5 w-5" />
                          </div>
                          <div className="space-y-1 overflow-hidden flex-1 min-w-0">
                            <h4 className="font-extrabold text-xs text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                              {p.medicine}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-semibold truncate">
                              {p.dosage} {p.frequency ? `· ${p.frequency}` : ""}
                            </p>
                            <div className="flex items-center gap-1.5 pt-1">
                              <Badge className="bg-emerald-100 text-emerald-800 text-[8px] font-bold border-none px-1.5 py-0.5">
                                {p.duration}
                              </Badge>
                              <span className="text-[9px] text-slate-400 font-medium truncate">
                                By {p.doctor}
                              </span>
                            </div>
                          </div>
                          <div className="text-slate-300 group-hover:text-emerald-600 transition-colors">
                            <Printer className="h-4 w-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column (5 cols): Section 5 Recent Reports & Section 7 Recent Consultations */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* SECTION 5: RECENT REPORTS */}
              <Card className="bg-white border border-slate-100 shadow-md rounded-[24px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/50 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-[#2563eb]" /> Recent Diagnostic Reports
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">Diagnostic files & lab attachments</CardDescription>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-[#2563eb] font-bold text-xs"
                    onClick={() => navigate("/dashboard/user/reports")}
                  >
                    View All ({reportsCount})
                  </Button>
                </CardHeader>
                <CardContent className="p-5">
                  {reports.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-bold">No diagnostic reports uploaded yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Test reports uploaded at Onyx kiosks or clinics will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.slice(0, 3).map((report) => (
                        <div 
                          key={report._id || report.id} 
                          onClick={() => handleOpenReport(report)}
                          className="flex items-center justify-between p-3.5 rounded-[16px] border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 hover:border-blue-200 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <FileCheck className="h-4.5 w-4.5" />
                            </div>
                            <div className="overflow-hidden min-w-0">
                              <h4 className="font-extrabold text-slate-800 text-xs truncate max-w-[170px] group-hover:text-[#2563eb] transition-colors">
                                {report.reportCode || "Diagnostic Health Report"}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium">
                                Uploaded {report.createdAt ? new Date(report.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-200">
                              ABDM Ready
                            </Badge>
                            <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#2563eb] transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SECTION 7: RECENT CONSULTATIONS & CLINICAL CHECKUPS */}
              <Card className="bg-white border border-slate-100 shadow-md rounded-[24px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/50 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-[#14213D]" /> Consultation History
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">Completed doctor sessions and diagnostic history</CardDescription>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-[#2563eb] font-bold text-xs"
                    onClick={() => navigate("/dashboard/user/consultations")}
                  >
                    View History
                  </Button>
                </CardHeader>
                <CardContent className="p-5">
                  {completedConsultations.length === 0 && sessions.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      <Stethoscope className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-bold">No consultation history found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Your past doctor consultations and diagnostic kiosk sessions will be archived here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Priority 1: Completed Telehealth Consultations */}
                      {completedConsultations.slice(0, 3).map((consult, idx) => (
                        <div key={consult._id || consult.id || `c-${idx}`} className="flex gap-3 relative">
                          {idx !== Math.min(completedConsultations.length - 1, 2) && (
                            <div className="absolute left-[13px] top-[26px] bottom-[-16px] w-0.5 bg-slate-200"></div>
                          )}
                          
                          <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                            ✓
                          </div>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-extrabold text-slate-800 text-xs truncate">
                                {consult.doctorId?.name ? (consult.doctorId.name.toLowerCase().startsWith("dr") ? consult.doctorId.name : `Dr. ${consult.doctorId.name}`) : "Doctor Consultation"}
                              </h4>
                              <Badge className="bg-slate-100 text-slate-700 border-none font-bold text-[8px] uppercase">
                                Completed
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium truncate">
                              {consult.condition || consult.reason || consult.doctorId?.specialty || "Telehealth Consultation"}
                            </p>
                            <p className="text-[9px] text-slate-400 font-mono">
                              {consult.callEndedAt ? new Date(consult.callEndedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : consult.createdAt ? new Date(consult.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Archived"}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Priority 2: Kiosk Diagnostic Screening Sessions */}
                      {completedConsultations.length < 3 && sessions.slice(0, 3 - completedConsultations.length).map((session, idx) => (
                        <div key={session._id || session.id || `s-${idx}`} className="flex gap-3 relative">
                          <div className="h-7 w-7 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                            <Activity className="h-3.5 w-3.5" />
                          </div>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-extrabold text-slate-800 text-xs truncate">
                                Diagnostic Kiosk Health Checkup
                              </h4>
                              <Badge className="bg-slate-100 text-slate-700 border-none font-bold text-[8px] uppercase">
                                {session.status || "Completed"}
                              </Badge>
                            </div>
                            <p className="text-[9px] text-slate-400 font-mono">
                              {session.createdAt ? new Date(session.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Archived Session"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

          </div>

        </div>
      ) : (
        <div className="mt-4">
          <Outlet />
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserDashboard;
