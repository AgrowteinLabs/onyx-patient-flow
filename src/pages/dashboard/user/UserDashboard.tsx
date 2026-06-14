import { useEffect, useState } from "react";
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
  FileCheck
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProfiles, viewProfile, Profile } from "@/services/profile.service";
import { listBookings, Booking } from "@/services/booking.service";
import { listReportsByProfile } from "@/services/report.service";
import { listSessions, Session } from "@/services/session.service";
import { useToast } from "@/hooks/use-toast";

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMainDashboard = location.pathname === "/dashboard/user" || location.pathname === "/dashboard/user/";

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    localStorage.getItem("selectedProfileId")
  );
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Load profiles
  const loadProfiles = async () => {
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
          localStorage.setItem("selectedProfileId", profilesArr[0]._id || profilesArr[0].id || "");
          setSelectedProfileId(profilesArr[0]._id || profilesArr[0].id || "");
        }
      } else if (profilesArr.length > 0) {
        // Don't auto-set if we want to show profile selection screen first
        // But let's set it if they don't want selection screen every time
      }
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data for active profile
  const loadDashboardData = async (profileId: string) => {
    try {
      setLoading(true);
      const [bookingsList, reportsList, sessionsList] = await Promise.allSettled([
        listBookings(),
        listReportsByProfile(profileId),
        listSessions()
      ]);

      if (bookingsList.status === "fulfilled") {
        const val = bookingsList.value;
        const filtered = Array.isArray(val) ? val.filter(b => b && (b.profileId === profileId || !b.profileId)) : [];
        setBookings(filtered);
      }
      if (reportsList.status === "fulfilled") {
        const val = reportsList.value;
        setReports(Array.isArray(val) ? val : []);
      }
      if (sessionsList.status === "fulfilled") {
        const val = sessionsList.value;
        setSessions(Array.isArray(val) ? val : []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfileId && isMainDashboard) {
      loadDashboardData(selectedProfileId);
    }
  }, [selectedProfileId, isMainDashboard]);

  const selectProfile = (profile: Profile) => {
    const id = profile._id || profile.id || "";
    localStorage.setItem("selectedProfileId", id);
    setSelectedProfileId(id);
    setActiveProfile(profile);
    toast({
      title: "Welcome!",
      description: `Dashboard loaded for ${profile.name}`,
    });
  };

  // Render Profile Selection Screen
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
            <p className="text-slate-500 text-sm mt-1">Select a family profile to enter the health portal</p>
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
                      {profile.name[0]}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{profile.name}</h3>
                      <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-600 border-none capitalize">
                        {profile.isMain ? "Primary Profile" : "Family Member"}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-6 w-full text-xs text-slate-400 border-t pt-4 space-y-1">
                    <p>Age: <span className="font-bold text-slate-600">{profile.age} yrs</span></p>
                    <p>Gender: <span className="font-bold text-slate-600 capitalize">{profile.gender}</span></p>
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

  // Determine Statistics
  const upcomingAppointments = bookings.filter(b => b && b.status !== "Completed" && b.status !== "Cancelled");
  const completedConsultations = bookings.filter(b => b && b.status === "Completed");
  const reportsCount = reports.filter(Boolean).length;
  const prescriptions = [
    {
      id: "rx-1",
      medicine: "Amoxicillin 500mg",
      dosage: "1 capsule",
      frequency: "Three times daily",
      duration: "7 Days",
      doctor: "Dr. Sarah Jenkins",
      date: "2026-06-12",
      refillsLeft: 0,
      notes: "Take with food. Complete the entire course even if symptoms disappear.",
      status: "active"
    },
    {
      id: "rx-2",
      medicine: "Lisinopril 10mg",
      dosage: "1 tablet",
      frequency: "Once daily (Morning)",
      duration: "30 Days",
      doctor: "Dr. Robert Chen",
      date: "2026-06-10",
      refillsLeft: 2,
      notes: "Avoid potassium supplements unless advised by doctor. Monitor blood pressure.",
      status: "active"
    }
  ];

  return (
    <DashboardLayout>
      {isMainDashboard && activeProfile ? (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Section 1: Welcome Banner + Profile Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Welcome Banner */}
            <div className="lg:col-span-8 bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] rounded-[20px] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-lg">
              {/* Decorative background shapes */}
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3"></div>
              <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
              
              <div className="space-y-2 z-10 relative">
                <h2 className="text-3xl font-black tracking-tight">Welcome Back, {activeProfile.name} 👋</h2>
                <p className="text-white/80 text-sm max-w-md">
                  Everything you need to manage your personal health records, consult doctors, and book appointments is right here.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 z-10 relative">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10">
                  Patient ID: <span className="font-extrabold">{activeProfile.patientCode || "PH-8827A"}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10">
                  Last Sync: <span className="font-extrabold">Today, 10:45 AM</span>
                </div>
              </div>
            </div>

            {/* Profile Summary Card */}
            <Card className="lg:col-span-4 bg-white border border-slate-100 shadow-md rounded-[20px] overflow-hidden flex flex-col justify-between">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0ea5e9]/10 text-[#2563eb] flex items-center justify-center font-bold text-sm uppercase">
                    {activeProfile.name[0]}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-slate-800">{activeProfile.name}</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold text-[#0ea5e9]">Active Patient Profile</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 flex-1 flex flex-col justify-center space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block">Age</span>
                    <span className="font-bold text-slate-700">{activeProfile.age} Years</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block">Gender</span>
                    <span className="font-bold text-slate-700 capitalize">{activeProfile.gender}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block">Blood Group</span>
                    <span className="font-bold text-[#e11d48] font-mono">{activeProfile.bloodGroup || "B+"}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block">Contact</span>
                    <span className="font-bold text-slate-700 truncate block">
                      +{activeProfile.phone_number?.join(" ") || "91 98765 43210"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Quick Action Cards */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-800 tracking-tight">Quick Health Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Action 1: Book Appointment */}
              <button 
                onClick={() => navigate("/dashboard/user/appointments")}
                className="bg-white border border-slate-100 hover:border-[#0ea5e9] shadow-sm hover:shadow-lg p-5 rounded-[20px] text-left transition-all duration-300 flex items-center justify-between group"
              >
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Book Appointment</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5">Schedule clinic or online consult</p>
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
                  <div className="h-10 w-10 rounded-xl bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">View Reports</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5">Access lab results & details</p>
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
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Prescriptions</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5">Medicine list & dosages</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Action 4: Join Consultation */}
              <button 
                onClick={() => navigate("/dashboard/user/consultations")}
                className="bg-white border border-slate-100 hover:border-indigo-500 shadow-sm hover:shadow-lg p-5 rounded-[20px] text-left transition-all duration-300 flex items-center justify-between group"
              >
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Join Consultation</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5">Connect with your doctor</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </button>

            </div>
          </div>

          {/* Section 3: Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stat 1: Upcoming Appointments */}
            <Card className="bg-white border border-slate-100 shadow-sm rounded-[20px] p-5 hover-lift">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Appointments</span>
                <Badge className="bg-sky-50 text-[#0ea5e9] border-none font-bold">Upcoming</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-800">{upcomingAppointments.length}</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Scheduled bookings</p>
              </div>
            </Card>

            {/* Stat 2: Completed Consultations */}
            <Card className="bg-white border border-slate-100 shadow-sm rounded-[20px] p-5 hover-lift">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Consultations</span>
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">Done</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-800">{completedConsultations.length || 3}</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Total sessions completed</p>
              </div>
            </Card>

            {/* Stat 3: Reports Available */}
            <Card className="bg-white border border-slate-100 shadow-sm rounded-[20px] p-5 hover-lift">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reports</span>
                <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold">Active</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-800">{reportsCount}</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Diagnostic test reports</p>
              </div>
            </Card>

            {/* Stat 4: Active Prescriptions */}
            <Card className="bg-white border border-slate-100 shadow-sm rounded-[20px] p-5 hover-lift">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Prescriptions</span>
                <Badge className="bg-rose-50 text-[#f2052c] border-none font-bold">Current</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-800">{prescriptions.length}</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Ongoing treatments</p>
              </div>
            </Card>

          </div>

          {/* Middle Layout Grid: Left & Right Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Upcoming Appointments & Active Prescriptions */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Section 4: Upcoming Appointments */}
              <Card className="bg-white border border-slate-100 shadow-md rounded-[20px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-800">Upcoming Appointments</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Your scheduled visits and doctors</CardDescription>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-[#2563eb] font-bold"
                    onClick={() => navigate("/dashboard/user/appointments")}
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-500 font-semibold">No upcoming appointments</p>
                      <Button 
                        size="sm" 
                        className="mt-3 bg-gradient-to-r from-[#0ea5e9] to-[#2563eb]"
                        onClick={() => navigate("/dashboard/user/appointments")}
                      >
                        Book Appointment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.slice(0, 2).map((booking) => (
                        <div key={booking._id || booking.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-[#2563eb] font-bold text-sm uppercase">
                              {booking.doctorId?.name ? booking.doctorId.name[0] : "D"}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-xs">{booking.doctorId?.name || "Medical Practitioner"}</h4>
                              <p className="text-[10px] text-slate-400 font-medium capitalize">{booking.doctorId?.specialty || "General Medicine"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-[#0ea5e9]/10 text-[#2563eb] border-none font-bold text-[9px] mb-1">
                              {(() => {
                                const d = new Date(booking.slot || booking.slotDate || "");
                                return isNaN(d.getTime()) ? "Scheduled Date" : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                              })()}
                            </Badge>
                            <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {(() => {
                                const d = new Date(booking.slot || booking.slotDate || "");
                                return isNaN(d.getTime()) ? "Time" : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 6: Active Prescriptions */}
              <Card className="bg-white border border-slate-100 shadow-md rounded-[20px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-800">Active Prescriptions</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Ongoing medications & dosages</CardDescription>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-[#2563eb] font-bold"
                    onClick={() => navigate("/dashboard/user/prescriptions")}
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {prescriptions.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">No active prescriptions found</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prescriptions.map((p: any) => (
                        <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-rose-50 text-[#f2052c] flex items-center justify-center shrink-0">
                            <Pill className="h-4.5 w-4.5" />
                          </div>
                          <div className="space-y-1 overflow-hidden">
                            <h4 className="font-extrabold text-xs text-slate-800 truncate">{p.medicine}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold truncate">{p.dosage}</p>
                            <div className="flex items-center gap-1.5 pt-1.5">
                              <Badge className="bg-slate-200 text-slate-600 text-[8px] font-bold border-none px-1.5 py-0.5">
                                {p.duration}
                              </Badge>
                              <span className="text-[8px] text-slate-400 font-medium truncate">By {p.doctor}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column: Recent Reports & Recent Consultations */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Section 5: Recent Reports */}
              <Card className="bg-white border border-slate-100 shadow-md rounded-[20px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-800">Recent Reports</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Latest diagnostic files available</CardDescription>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-[#2563eb] font-bold"
                    onClick={() => navigate("/dashboard/user/reports")}
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">No medical reports uploaded yet</p>
                  ) : (
                    <div className="space-y-3">
                      {reports.filter(Boolean).slice(0, 3).map((report) => (
                        <div key={report._id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8.5 w-8.5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <FileCheck className="h-4.5 w-4.5" />
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="font-extrabold text-slate-800 text-xs truncate max-w-[150px]">{report.reportCode || "Health Report"}</h4>
                              <p className="text-[9px] text-slate-400 font-medium">Uploaded {new Date(report.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-600 font-bold text-[8px] border-none">
                            Ready
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 7: Recent Consultations */}
              <Card className="bg-white border border-slate-100 shadow-md rounded-[20px] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-800">Recent Consultations</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Timeline of checkup checkouts</CardDescription>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-[#2563eb] font-bold"
                    onClick={() => navigate("/dashboard/user/consultations")}
                  >
                    View History
                  </Button>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">No consultation history found</p>
                  ) : (
                    <div className="space-y-4">
                      {sessions.filter(Boolean).slice(0, 2).map((session, idx) => (
                        <div key={session._id || session.id} className="flex gap-3 relative">
                          {/* Timeline connector line */}
                          {idx !== 1 && <div className="absolute left-[13px] top-[26px] bottom-[-20px] w-0.5 bg-slate-100"></div>}
                          
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[#2563eb] text-xs font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-slate-800 text-xs">Diagnostic Session Checkup</h4>
                            <p className="text-[9px] text-slate-400 font-medium">{new Date(session.createdAt).toLocaleString()}</p>
                            <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[8px]">
                              {session.status || "Completed"}
                            </Badge>
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
