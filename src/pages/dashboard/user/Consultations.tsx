import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { listSessions, Session } from "@/services/session.service";
import { listBookings, Booking } from "@/services/booking.service";
import { apiRequest } from "@/lib/api-request";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Clock, 
  User, 
  Calendar, 
  RefreshCcw, 
  AlertCircle, 
  Paperclip,
  CheckCircle2,
  Tv
} from "lucide-react";

const Consultations = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  // Video Consultation states
  const [inVideoCall, setInVideoCall] = useState(false);
  const [videoToken, setVideoToken] = useState("");
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);

  // Consultation Detail Modal
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, bookingsList] = await Promise.all([
        listSessions("Completed").catch(() => []),
        listBookings().catch(() => [])
      ]);
      
      const sessionsArr = Array.isArray(sessionsData) ? sessionsData : [];
      setSessions(sessionsArr);
      
      const storedProfileId = localStorage.getItem("selectedProfileId");
      const bookingsArr = Array.isArray(bookingsList) ? bookingsList : [];
      const upcoming = bookingsArr.filter(
        b => b && b.status !== "Completed" && b.status !== "Cancelled" && (b.profileId === storedProfileId || !b.profileId)
      );
      
      upcoming.sort((a, b) => {
        const timeA = new Date(a.slot || a.slotDate || 0).getTime();
        const timeB = new Date(b.slot || b.slotDate || 0).getTime();
        return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      });
      
      setBookings(upcoming);
      if (upcoming.length > 0) {
        setNextBooking(upcoming[0]);
      } else {
        setNextBooking(null);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load consultations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleJoinCall = async () => {
    try {
      const targetBookingId = nextBooking?._id || nextBooking?.id || "mock-booking-id-123";
      const res: any = await apiRequest(`/api/video/token/${targetBookingId}`, { method: "GET" })
        .catch(() => ({ token: "mock-agora-video-jwt-token-xyz" }));
      
      setVideoToken(res.token || "mock-token-xyz");
      setInVideoCall(true);
      toast({ title: "Connecting to secure telehealth server..." });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndCall = () => {
    setInVideoCall(false);
    toast({ title: "Consultation ended successfully" });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Video className="h-8 w-8 text-[#2563eb]" /> Telehealth & Consultations
          </h1>
          <p className="text-slate-500 text-sm mt-1">Join live video visits and explore your consultation summaries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadData} disabled={loading} className="rounded-full">
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Video Consultation Status / Active Call Panel */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Live Call Control Panel */}
          {inVideoCall ? (
            <Card className="bg-slate-900 text-white border-none rounded-[20px] overflow-hidden shadow-2xl relative min-h-[420px] flex flex-col justify-between">
              
              {/* Doctor Video Feed (Big background) */}
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="h-24 w-24 rounded-full bg-slate-800 border-2 border-slate-700/80 flex items-center justify-center text-slate-300 font-extrabold text-2xl animate-pulse">
                    DR
                  </div>
                  <h3 className="font-extrabold text-sm">Dr. Sarah Jenkins</h3>
                  <Badge className="bg-emerald-500 text-white text-[9px] font-bold border-none">Doctor is connected</Badge>
                </div>
              </div>

              {/* Patient Video Feed (Floating Pip window) */}
              {cameraActive ? (
                <div className="absolute bottom-20 right-4 h-32 w-24 rounded-xl border border-slate-700/80 bg-slate-800 overflow-hidden shadow-md">
                  <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-950 uppercase">
                    You
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-20 right-4 h-32 w-24 rounded-xl border border-slate-700/80 bg-slate-900 flex items-center justify-center shadow-md">
                  <VideoOff className="h-6 w-6 text-slate-600" />
                </div>
              )}

              {/* Header Status overlay */}
              <div className="p-4 z-10 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Live Consultation</span>
                </div>
                <div className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/5">
                  03:14
                </div>
              </div>

              {/* Footer Controls overlay */}
              <div className="p-5 z-10 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-4">
                {/* Mute Mic */}
                <Button 
                  onClick={() => setMicActive(!micActive)}
                  variant="outline" 
                  size="icon" 
                  className={`h-11 w-11 rounded-full border-none shadow-md ${
                    micActive ? "bg-white/10 hover:bg-white/20 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
                  }`}
                >
                  {micActive ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
                </Button>

                {/* End Call */}
                <Button 
                  onClick={handleEndCall}
                  className="h-11 px-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg"
                >
                  <PhoneOff className="h-4.5 w-4.5 mr-2" /> Leave Consultation
                </Button>

                {/* Toggle Camera */}
                <Button 
                  onClick={() => setCameraActive(!cameraActive)}
                  variant="outline" 
                  size="icon" 
                  className={`h-11 w-11 rounded-full border-none shadow-md ${
                    cameraActive ? "bg-white/10 hover:bg-white/20 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
                  }`}
                >
                  {cameraActive ? <Video className="h-4.5 w-4.5" /> : <VideoOff className="h-4.5 w-4.5" />}
                </Button>
              </div>

            </Card>
          ) : (
            <Card className="bg-white border-slate-100 shadow-md rounded-[20px] p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-[#0ea5e9]/10 text-[#2563eb] flex items-center justify-center">
                    <Video className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Virtual Telehealth Clinic</h3>
                    <Badge variant="secondary" className="bg-[#0ea5e9]/10 text-[#2563eb] border-none font-bold text-[9px] mt-1">
                      Ready to Join
                    </Badge>
                  </div>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed max-w-md">
                  Consult with your medical expert in a secure, HIPAA-compliant video session. Click the button below when your slot is ready to connect.
                </p>

                {nextBooking ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 max-w-sm">
                    <Clock className="h-4 w-4 text-[#2563eb]" />
                    <span>
                      Next visit with <span className="font-bold text-slate-800">{nextBooking.doctorId?.name || "Medical Expert"}</span>:{" "}
                      <span className="font-bold text-slate-800">
                        {(() => {
                          const d = new Date(nextBooking.slot || nextBooking.slotDate || "");
                          return isNaN(d.getTime()) ? "Scheduled Time" : d.toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                        })()}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 max-w-sm">
                    <Clock className="h-4 w-4 text-[#2563eb]" />
                    <span>No upcoming telehealth appointments scheduled.</span>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <Button 
                  onClick={handleJoinCall}
                  className="bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] hover:opacity-95 text-white font-bold rounded-xl shadow-md h-11 px-6 text-xs"
                  disabled={!nextBooking}
                >
                  <Video className="h-4 w-4 mr-2" /> Start Video Consultation
                </Button>
              </div>

            </Card>
          )}

          {/* Consultation Summaries List */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-extrabold text-slate-800">Visit Summary Logs</CardTitle>
              <CardDescription className="text-xs text-slate-400">Summaries, prescriptions and doctor suggestions from completed visits</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-32 bg-slate-50 rounded-xl animate-pulse"></div>
              ) : sessions.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No summaries logs available yet</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sessions.slice(0, 3).map((session) => (
                    <div key={session._id || session.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <CheckCircle2 className="h-4.5 w-4.5 text-[#2563eb]" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs">Diagnostic Checkout Session</h4>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                            Conducted {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedSession(session);
                          setOpenDetailDialog(true);
                        }}
                        variant="ghost" 
                        size="sm" 
                        className="text-[#2563eb] font-bold text-xs"
                      >
                        View Summary
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right: History timelines */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">Consultation Timeline</CardTitle>
              <CardDescription className="text-xs text-slate-400">Your health journey and milestone checkups</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-32 bg-slate-50 rounded-xl animate-pulse"></div>
              ) : sessions.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No history available</p>
              ) : (
                <div className="space-y-6">
                  {sessions.map((session, idx) => (
                    <div key={session._id || session.id} className="flex gap-4 relative">
                      {/* Timeline line connector */}
                      {idx !== sessions.length - 1 && <div className="absolute left-[15px] top-[30px] bottom-[-24px] w-0.5 bg-slate-100"></div>}
                      
                      <div className="h-8 w-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-[#2563eb] text-xs font-bold shrink-0 shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="space-y-1 bg-slate-50/50 p-4.5 rounded-xl border border-slate-50 flex-1">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">
                          {new Date(session.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-xs">Completed Consultation</h4>
                        <p className="text-[9.5px] text-slate-500 font-semibold leading-relaxed pt-1">
                          Diagnosed details synced with diagnostic panel. Medical equipment values updated.
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

      {/* Summary Logs Dialog */}
      <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
        <DialogContent className="sm:max-w-md rounded-[20px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Consultation Summary
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Milestone values and diagnostic results recorded during checkout.
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Date & Time:</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedSession.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Diagnostic Equipment:</span>
                  <span className="font-semibold text-slate-800">{selectedSession.productId?.name || "Onyx Diagnostic Device"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Device Model No:</span>
                  <span className="font-semibold text-slate-800">{selectedSession.productId?.modelNo || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Billing Status:</span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[8px]">Paid</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinical Observations</h4>
                <div className="p-3 bg-white border border-slate-100 rounded-lg text-xs font-semibold text-slate-500 leading-relaxed">
                  {selectedSession.notes || selectedSession.clinicalObservations || selectedSession.suggestions || "No clinical observations recorded for this diagnostic checkout."}
                </div>
              </div>

              <DialogFooter className="flex justify-end pt-4">
                <Button 
                  onClick={() => setOpenDetailDialog(false)}
                  className="bg-[#2563eb] text-white font-bold rounded-xl shadow-md text-xs px-5"
                >
                  Close Summary
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Consultations;
