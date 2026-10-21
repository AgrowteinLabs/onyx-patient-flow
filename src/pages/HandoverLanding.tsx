import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Stethoscope, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { consumeHandshakeTicket } from "@/services/auth.service";
import { setAuthToken } from "@/lib/api-request";

export default function HandoverLanding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const executedRef = useRef(false);

  const ticket = searchParams.get("ticket");
  const envParam = searchParams.get("env");

  useEffect(() => {
    // Guard against React StrictMode double-execution
    if (executedRef.current) return;
    executedRef.current = true;

    async function executeHandover() {
      if (!ticket) {
        setError("Invalid or missing session ticket. Please initiate consultation from your mobile app.");
        return;
      }

      try {
        const data = await consumeHandshakeTicket(ticket, envParam);

        if (data && (data.status === "success" || data.token || data.accessToken)) {
          const token = data.token || data.accessToken;
          if (token) {
            setAuthToken(token);
          }
          if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
          }

          const user = data.user || {};
          const role = (user.role || "user").replace(/_/g, "-").toLowerCase();
          localStorage.setItem("userRole", role);
          if (user.id || user._id) {
            localStorage.setItem("userId", user.id || user._id);
          }
          localStorage.setItem("user", JSON.stringify(user));

          const payload = data.payload || {};
          if (payload.profileId) {
            localStorage.setItem("selectedProfileId", payload.profileId);
          }

          // 2. Remove sensitive ticket parameter from browser history
          window.history.replaceState({}, document.title, window.location.pathname);

          // 3. Seamlessly redirect directly to the consultation room or doctor selector
          const { bookingId, reportId, doctorId, targetRoute } = payload;

          if (bookingId) {
            navigate(`/dashboard/user/consultations?bookingId=${bookingId}&autoJoin=true`, { replace: true });
          } else if (targetRoute) {
            if (targetRoute.startsWith("/consultation/room")) {
              const extractedBookingId = targetRoute.split("/").pop();
              navigate(`/dashboard/user/consultations?bookingId=${extractedBookingId}&autoJoin=true`, { replace: true });
            } else if (targetRoute.startsWith("/consultation/select-doctor")) {
              navigate(`/dashboard/user/appointments?doctorId=${doctorId || ""}&reportId=${reportId || ""}`, { replace: true });
            } else {
              navigate(targetRoute, { replace: true });
            }
          } else if (doctorId) {
            navigate(`/dashboard/user/appointments?doctorId=${doctorId}&reportId=${reportId || ""}`, { replace: true });
          } else {
            navigate("/dashboard/user/consultations", { replace: true });
          }
        } else {
          setError(data?.error || "The consultation session has expired or is invalid. Please retry from the mobile app.");
        }
      } catch (err: any) {
        console.error("Handshake consumption error:", err);
        setError(err.message || "Failed to connect to telehealth servers. Please check your connection.");
      }
    }

    executeHandover();
  }, [ticket, envParam, navigate]);

  if (error) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

        <div className="relative z-10 max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/20 shadow-inner">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">Session Link Expired</h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">{error}</p>

          <div className="mt-6 flex flex-col gap-2.5 w-full">
            <Button 
              onClick={() => navigate("/login")}
              className="w-full bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] hover:opacity-95 text-white font-bold h-11 rounded-xl shadow-md text-xs flex items-center justify-center gap-2"
            >
              <span>Continue to Standard Login</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full border-slate-800 hover:bg-slate-800/60 text-slate-300 font-bold h-10 rounded-xl text-xs"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4 relative overflow-hidden px-6 text-center">
      {/* Decorative gradients */}
      <div className="absolute w-96 h-96 bg-[#2563eb]/15 rounded-full blur-3xl top-1/4 -left-20 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-[#0d9488]/15 rounded-full blur-3xl bottom-1/4 -right-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#0ea5e9] to-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-950 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="space-y-1.5 max-w-sm">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#0ea5e9]" />
            <span className="text-sm font-black tracking-wide text-white">Connecting Telehealth Session...</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Authenticating your mobile screening session and retrieving vital records
          </p>
        </div>
      </div>
    </div>
  );
}
