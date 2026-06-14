import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Heart, Phone, Lock, CheckCircle2, Shield, Stethoscope, HeartPulse, Plus, Activity, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  userAuth,
  userAuthVerify,
  signinNonUser,
  verifyNonUser,
  requestPasswordResetOtp,
  resetPassword,
} from "@/services/auth.service";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unexpected error occurred.";
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode] = useState<"admin" | "patient">("patient");
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"phone" | "reset">("phone");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotTimer, setForgotTimer] = useState(0);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    if (forgotTimer > 0) {
      const interval = setInterval(() => setForgotTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [forgotTimer]);

  // ============================
  // Step 1: Send OTP
  // ============================
  const handleSendOtp = async () => {
    if (!phone) {
      toast({
        title: "Missing number",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    setSendingOtp(true);
    try {
      const phonePayload = ["91", phone];
      console.log("📱 Sending OTP request:", { mode, phonePayload });

      let response;
      if (mode === "patient") {
        response = await userAuth(phonePayload);
      } else {
        response = await signinNonUser(phonePayload);
      }

      console.log("✅ OTP Sent response:", response);

      toast({
        title: "OTP Sent",
        description: response?.message || "Check your phone for the OTP.",
      });

      setStep("verify");
      setTimer(30);
    } catch (error: any) {
      console.error("❌ OTP Send Error:", error);
      toast({
        title: "Failed to send OTP",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // ============================
  // Step 2: Verify OTP + Password
  // ============================
  const handleVerify = async () => {
    if (!otp) {
      toast({
        title: "Missing OTP",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }
    if (mode === "admin" && !password) {
      toast({
        title: "Missing password",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Verifying credentials:", { mode, otp, password });

      let response;
      if (mode === "patient") {
        response = await userAuthVerify({
          otp,
        });
      } else {
        response = await verifyNonUser({
          otp,
          password,
        });
      }

      console.log("✅ Verify response:", response);

      if (!response || (!response.accessToken && !response.token)) {
        throw new Error("Invalid credentials or empty response from server.");
      }

      // ✅ Normalize role: convert underscores to hyphens
      const normalizedRole = (response.role || mode).replace(/_/g, "-");

      // ✅ Store tokens and user info
      localStorage.setItem("authToken", response.accessToken || response.token);
      localStorage.setItem("refreshToken", response.refreshToken || "");
      localStorage.setItem("userRole", normalizedRole);
      localStorage.setItem("userPhone", phone);

      // ✅ Store organization info if available
      if (response.organization) {
        localStorage.setItem(
          "organizationId",
          response.organization._id || response.organization.id
        );
        localStorage.setItem(
          "organizationName",
          response.organization.organizationName || ""
        );
        localStorage.setItem(
          "organizationCode",
          response.organization.organizationCode || ""
        );
        localStorage.setItem(
          "userOrganization",
          JSON.stringify(response.organization)
        );
      }

      toast({
        title: "Success",
        description: "Login successful, redirecting to your dashboard...",
      });

      const targetRole = (normalizedRole === "executive" || normalizedRole === "executive-admin") ? "user" : normalizedRole;
      navigate(`/dashboard/${targetRole}`, { replace: true });
    } catch (error: any) {
      console.error("❌ Verification Error:", error);
      toast({
        title: "Verification failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Forgot Password Flow
  // ============================
  const handleForgotRequestOtp = async () => {
    if (!forgotPhone) {
      toast({ title: "Error", description: "Please enter your phone number", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    try {
      const response = await requestPasswordResetOtp(["91", forgotPhone]);
      toast({ title: "OTP Sent", description: response?.message || "Check your phone for the reset OTP." });
      setForgotPasswordStep("reset");
      setForgotTimer(30);
    } catch (error: any) {
      toast({ title: "Failed to send OTP", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async () => {
    if (!forgotOtp || !newPassword) {
      toast({ title: "Error", description: "Please enter OTP and new password", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters long", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    try {
      const response = await resetPassword({
        phone_number: ["91", forgotPhone],
        otp: forgotOtp,
        new_password: newPassword,
      });
      toast({ title: "Password Reset Successful", description: response?.message || "You can now login with your new password." });
      setForgotPasswordOpen(false);
      
      // reset states
      setTimeout(() => {
        setForgotPasswordStep("phone");
        setForgotPhone("");
        setForgotOtp("");
        setNewPassword("");
      }, 500);
    } catch (error: any) {
      toast({ title: "Reset Failed", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  // ============================
  // UI Layout
  // ============================
  return (
    <div 
      className="min-h-screen lg:h-screen w-full flex flex-col justify-between p-6 md:p-8 lg:p-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #DFF9FF 0%, #F8FCFF 50%, #FFFFFF 100%)",
      }}
    >
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-[#35B7C9]/5 blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#F2052C]/5 blur-3xl pointer-events-none"></div>

      {/* Floating Healthcare decorative elements */}
      <div className="absolute top-[15%] left-[5%] opacity-20 pointer-events-none hidden md:block animate-pulse">
        <Plus className="h-6 w-6 text-[#35B7C9]" strokeWidth={2} />
      </div>
      <div className="absolute bottom-[25%] right-[10%] opacity-20 pointer-events-none hidden md:block">
        <Heart className="h-7 w-7 text-[#F2052C]" strokeWidth={2} />
      </div>
      <div className="absolute top-[40%] right-[35%] opacity-15 pointer-events-none hidden md:block">
        <div className="w-4 h-4 rounded-full border-2 border-[#35B7C9]"></div>
      </div>
      <div className="absolute bottom-[15%] left-[40%] opacity-15 pointer-events-none hidden md:block">
        <Activity className="w-10 h-5 text-[#35B7C9]" strokeWidth={2} />
      </div>

      {/* Top Header Row with Logo */}
      <div className="w-full max-w-7xl mx-auto flex justify-start items-center z-10">
        <img src="/ONYXHPLOGO.png" alt="Onyx Health+" className="h-10 w-auto object-contain" />
      </div>

      {/* Main Content Section */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl w-full mx-auto my-4 lg:my-0 z-10">
        
        {/* Left Side: Marketing & Illustration */}
        <div className="lg:col-span-7 flex flex-col justify-center text-left">
          
          {/* Badge */}
          <div className="flex justify-start">
            <span 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider transition-all"
              style={{
                backgroundColor: "rgba(53, 183, 201, 0.08)",
                borderColor: "#35B7C9",
                color: "#35B7C9",
              }}
            >
              <Heart className="h-4 w-4" />
              HEALTH PORTAL
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-[44px] font-black text-[#14213D] tracking-tight leading-[1.1] mt-4 mb-2">
            Your Health.<br />
            <span className="text-[#35B7C9]">Our Priority.</span>
          </h1>

          {/* Description */}
          <p className="text-[#475569] text-sm md:text-base max-w-lg mb-4 leading-relaxed">
            Access your appointments, health records, prescriptions and healthcare services.
          </p>

          {/* 3D Healthcare Illustration Mockup */}
          <div className="w-full max-w-[340px] p-4 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-lg shadow-[#35B7C9]/5 flex justify-center items-center">
            <svg className="w-full h-auto" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="drop-shadow" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#35B7C9" floodOpacity="0.08"/>
                </filter>
                <linearGradient id="platform-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DFF9FF"/>
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="heart-bubble-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#35B7C9" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#F2052C" stopOpacity="0.05"/>
                </linearGradient>
              </defs>
              
              {/* Floating Base Platform */}
              <ellipse cx="200" cy="210" rx="160" ry="20" fill="url(#platform-grad)" />

              {/* Mobile Phone Mockup */}
              <rect x="60" y="40" width="90" height="160" rx="18" fill="#14213D" />
              <rect x="64" y="44" width="82" height="152" rx="14" fill="white" />
              {/* Speaker & Camera Notch */}
              <rect x="95" y="44" width="20" height="5" rx="2.5" fill="#14213D" />
              <circle cx="120" cy="46.5" r="1.5" fill="#14213D" />
              
              {/* Phone Content (Patient Profile) */}
              <circle cx="105" cy="80" r="18" fill="#35B7C9" fillOpacity="0.08" />
              <circle cx="105" cy="76" r="6" fill="#35B7C9" />
              <path d="M95 92 c0-5 20-5 20 0 Z" fill="#35B7C9" />
              
              {/* Profile Card Lines */}
              <rect x="80" y="108" width="50" height="4" rx="2" fill="#e2e8f0" />
              <rect x="80" y="116" width="40" height="4" rx="2" fill="#e2e8f0" />
              
              {/* Activity Pulse on Screen */}
              <path d="M75 145 h15 l3-8 l3 16 l3-11 l2 3 h19" stroke="#35B7C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Heartbeat Bubble behind Calendar */}
              <path d="M200 85 C185 65 160 80 160 100 C160 120 185 140 200 150 C215 140 240 120 240 100 C240 80 215 65 200 85 Z" fill="url(#heart-bubble-grad)" filter="url(#drop-shadow)" />
              <path d="M175 105 h15 l3-8 l4 16 l3-11 l2 3 h18" stroke="#F2052C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Calendar Card (Floating Right) */}
              <g filter="url(#drop-shadow)">
                <rect x="220" y="65" width="110" height="90" rx="14" fill="white" />
                {/* Calendar Header */}
                <path d="M220 79 V65 H330 V79 Z" fill="#35B7C9" />
                <circle cx="235" cy="72" r="3" fill="white" opacity="0.8" />
                <circle cx="315" cy="72" r="3" fill="white" opacity="0.8" />
                {/* Calendar grids */}
                <rect x="235" y="90" width="12" height="12" rx="3" fill="#F8FAFC" />
                <rect x="255" y="90" width="12" height="12" rx="3" fill="#F8FAFC" />
                <rect x="275" y="90" width="12" height="12" rx="3" fill="#F8FAFC" />
                <rect x="295" y="90" width="12" height="12" rx="3" fill="#F8FAFC" />
                
                <rect x="235" y="110" width="12" height="12" rx="3" fill="#F8FAFC" />
                {/* Appointment Checked Date */}
                <rect x="255" y="110" width="32" height="32" rx="6" fill="#35B7C9" fillOpacity="0.1" stroke="#35B7C9" strokeWidth="1" />
                <circle cx="271" cy="126" r="8" fill="#35B7C9" />
                <path d="M268 126 l2 2 l4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                
                <rect x="295" y="110" width="12" height="12" rx="3" fill="#F8FAFC" />
                <rect x="235" y="130" width="12" height="12" rx="3" fill="#F8FAFC" />
                <rect x="295" y="130" width="12" height="12" rx="3" fill="#F8FAFC" />
              </g>

              {/* Medical Shield Outline (Floating Top Left) */}
              <g filter="url(#drop-shadow)" opacity="0.9">
                <path d="M320 35 c0-4-10-7-10-7 s-10 3-10 7 c0 8 3 15 10 18 c7-3 10-10 10-18 Z" fill="white" stroke="#35B7C9" strokeWidth="1.5" />
                <path d="M310 32 v10 M305 37 h10" stroke="#35B7C9" strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Floating Healthcare decorative symbols */}
              <circle cx="180" cy="40" r="4" fill="#35B7C9" opacity="0.6" />
              <path d="M210 175 h8 M214 171 v8" stroke="#35B7C9" strokeWidth="2" strokeLinecap="round" />
              <path d="M130 25 h6 M133 22 v6" stroke="#F2052C" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          
          <div className="w-full max-w-[420px] relative">
            {/* Top White Heart Circular Icon Container */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center border border-slate-50 z-20">
              <div className="h-11 w-11 rounded-full bg-[#F2052C]/10 flex items-center justify-center text-[#F2052C]">
                <Heart className="h-5 w-5 fill-[#F2052C]/10" />
              </div>
            </div>

            <Card className="border-none bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden p-6 pt-10 text-center">
              
              <CardHeader className="space-y-2 p-0">
                <div className="flex justify-center items-center mb-1">
                  <img src="/ONYXHPLOGO.png" alt="Onyx Health+" className="h-8 w-auto object-contain mx-auto" />
                </div>
                <CardTitle className="text-2xl font-black text-[#14213D]">Health Portal</CardTitle>
                <CardDescription className="text-slate-500 text-sm">
                  Access your appointments, health records, prescriptions and healthcare services.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 mt-6 p-0">
                
                {/* Step 1: Phone Input */}
                {step === "phone" && (
                  <div className="space-y-4">
                    <div className="space-y-2 text-left">
                      <Label className="text-sm font-bold text-[#14213D] ml-1">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <Input
                          type="tel"
                          placeholder="Enter Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={loading || sendingOtp}
                          className="rounded-xl border border-[#DCE5EF] bg-slate-50/50 h-[48px] pl-12 pr-5 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#35B7C9] focus-visible:border-[#35B7C9] transition-all"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleSendOtp}
                      className="w-full bg-gradient-to-r from-[#35B7C9] to-[#25C6DA] text-white font-bold h-[48px] rounded-xl transition-all shadow-md shadow-[#35B7C9]/15 text-sm hover:opacity-95"
                      disabled={sendingOtp || !phone}
                    >
                      {sendingOtp ? "Sending OTP..." : "Get Verification Code"}
                    </Button>


                  </div>
                )}

                {/* Step 2: Verify */}
                {step === "verify" && (
                  <div className="space-y-4">
                    <div className="space-y-2 text-left">
                      <Label className="text-sm font-bold text-[#14213D] ml-1">Verification Code (OTP)</Label>
                      <Input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={loading}
                        className="rounded-xl border border-[#DCE5EF] bg-slate-50/50 h-[48px] px-5 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#35B7C9] focus-visible:border-[#35B7C9] transition-all"
                      />
                    </div>

                    {mode === "admin" && (
                      <>
                        <div className="space-y-2 text-left">
                          <Label className="text-sm font-bold text-[#14213D] ml-1">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              disabled={loading}
                              className="rounded-xl border border-[#DCE5EF] bg-slate-50/50 h-[48px] pl-12 pr-12 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#35B7C9] focus-visible:border-[#35B7C9] transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                              disabled={loading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-1">
                          <button
                            type="button"
                            onClick={() => setForgotPasswordOpen(true)}
                            className="text-xs font-bold text-[#F2052C] hover:text-[#F2052C]/80 transition-colors mr-1"
                          >
                            Forgot password?
                          </button>
                        </div>
                      </>
                    )}

                    <Button
                      onClick={handleVerify}
                      className="w-full bg-gradient-to-r from-[#35B7C9] to-[#25C6DA] text-white font-bold h-[48px] rounded-xl transition-all shadow-md shadow-[#35B7C9]/15 text-sm hover:opacity-95"
                      disabled={loading}
                    >
                      {loading ? "Verifying..." : "Confirm Login"}
                    </Button>

                    <button
                      type="button"
                      className="w-full text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mt-2"
                      onClick={() => {
                        setStep("phone");
                        setOtp("");
                        setPassword("");
                        setShowPassword(false);
                      }}
                    >
                      ← Back to Phone Number
                    </button>

                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={timer > 0 || sendingOtp}
                        className={cn(
                          "text-xs font-bold transition-all",
                          timer > 0 ? "text-slate-400 cursor-not-allowed" : "text-[#35B7C9] hover:underline"
                        )}
                      >
                        {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't receive code? Resend OTP"}
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Features Section */}
      <div className="w-full max-w-7xl mx-auto border-t border-slate-200/60 pt-4 mt-4 lg:mt-0 flex flex-col lg:flex-row items-center justify-between gap-6 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full lg:w-auto">
          {/* Feature 1 */}
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-full bg-[#35B7C9]/8 flex items-center justify-center text-[#35B7C9] shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#14213D]">Secure & Private</h4>
              <p className="text-xs text-slate-500">Your data is safe with us</p>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-full bg-[#35B7C9]/8 flex items-center justify-center text-[#35B7C9] shrink-0">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#14213D]">Easy Access</h4>
              <p className="text-xs text-slate-500">Access healthcare anytime, anywhere</p>
            </div>
          </div>
          {/* Feature 3 */}
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-full bg-[#35B7C9]/8 flex items-center justify-center text-[#35B7C9] shrink-0">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#14213D]">Better Care</h4>
              <p className="text-xs text-slate-500">Connected care for a healthier you</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-xs text-slate-400 text-center lg:text-right">
          <span>© 2026 ONYX HEALTH+. All rights reserved.</span>
          <span className="hidden sm:inline">|</span>
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Secure & HIPAA Compliant
          </span>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md rounded-[24px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#F2052C] font-bold text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Reset Password
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm">
              {forgotPasswordStep === "phone"
                ? "Enter your mobile number to receive a reset OTP."
                : "Enter the OTP sent to your phone and your new password."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {forgotPasswordStep === "phone" ? (
              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-bold text-slate-700 ml-1">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      disabled={forgotLoading}
                      className="rounded-xl border border-slate-200 bg-slate-50 h-12 pl-12 pr-5 text-sm focus-visible:ring-2 focus-visible:ring-[#35B7C9] focus-visible:border-[#35B7C9]"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleForgotRequestOtp}
                  className="w-full bg-[#F2052C] hover:bg-[#F2052C]/90 text-white font-bold h-12 rounded-xl transition-all shadow-md shadow-[#F2052C]/15"
                  disabled={forgotLoading || !forgotPhone}
                >
                  {forgotLoading ? "Sending OTP..." : "Send Reset Code"}
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-bold text-slate-700 ml-1">OTP</Label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    disabled={forgotLoading}
                    className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-5 text-sm focus-visible:ring-2 focus-visible:ring-[#35B7C9] focus-visible:border-[#35B7C9]"
                  />
                </div>
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-bold text-slate-700 ml-1">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      type="password"
                      placeholder="Enter new password (min 8 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={forgotLoading}
                      className="rounded-xl border border-slate-200 bg-slate-50 h-12 pl-12 pr-5 text-sm focus-visible:ring-2 focus-visible:ring-[#35B7C9] focus-visible:border-[#35B7C9]"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleForgotResetPassword}
                  className="w-full bg-[#F2052C] hover:bg-[#F2052C]/90 text-white font-bold h-12 rounded-xl transition-all shadow-md shadow-[#F2052C]/15"
                  disabled={forgotLoading || !forgotOtp || !newPassword}
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </Button>
                <div className="mt-4 text-center">
                  <button
                     type="button"
                     onClick={handleForgotRequestOtp}
                     disabled={forgotTimer > 0 || forgotLoading}
                     className={cn(
                       "text-xs font-bold transition-all",
                       forgotTimer > 0 ? "text-slate-400 cursor-not-allowed" : "text-[#35B7C9] hover:underline"
                     )}
                  >
                    {forgotTimer > 0 ? `Resend OTP in ${forgotTimer}s` : "Didn't receive code? Resend OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
