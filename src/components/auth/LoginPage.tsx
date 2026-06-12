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
import { Eye, EyeOff, Heart, Phone, Lock, CheckCircle2 } from "lucide-react";
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

      navigate(`/dashboard/${normalizedRole}`, { replace: true });
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
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans">
      
      {/* Left Pane: Visuals / Brand Statement (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-white border-r border-slate-100 relative overflow-hidden">
        {/* Soft radial glow */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#35B7C9]/5 blur-3xl -translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#F2052C]/5 blur-3xl translate-x-1/3 translate-y-1/3"></div>
        
        {/* Brand Header */}
        <div className="flex items-center gap-2 z-10">
          <div className="h-10 w-10 rounded-xl bg-[#F2052C] flex items-center justify-center text-white shadow-md shadow-[#F2052C]/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">
            ONYX <span className="text-[#35B7C9]">HEALTH+</span>
          </span>
        </div>

        {/* Content Block */}
        <div className="my-auto z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#35B7C9]/10 text-[#35B7C9] border border-[#35B7C9]/20 mb-6 uppercase tracking-wider">
            Patient Portal
          </span>

          <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none mb-6">
            Your Health. <br />Simplified & <span className="text-[#35B7C9]">Personal.</span>
          </h2>

          <p className="text-slate-600 text-base leading-relaxed mb-8">
            Connect with providers, view medical histories, schedule visits, and access digital prescriptions all in one secure place.
          </p>

          {/* Patient Health Care Illustration */}
          <div className="w-full flex items-center justify-center p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
            <svg className="w-full max-w-[360px] h-auto" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 50 H390 M10 100 H390 M10 150 H390 M10 200 H390" stroke="#f1f5f9" strokeWidth="2"/>
              
              <rect x="40" y="30" width="320" height="190" rx="16" fill="white" stroke="#e2e8f0" strokeWidth="2"/>
              
              <path d="M60 120 H120 L130 80 L140 150 L150 110 L160 130 L170 120 H340" stroke="#35B7C9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              
              <path d="M220 70 C210 60 190 60 180 70 C170 80 170 100 180 110 L200 130 L220 110 C230 100 230 80 220 70 Z" fill="#F2052C" />
              
              <circle cx="100" cy="85" r="18" fill="#35B7C9" fillOpacity="0.08" stroke="#35B7C9" strokeWidth="1.5"/>
              <path d="M100 75 V85 C100 92 106 98 114 98" stroke="#35B7C9" strokeWidth="1.5" strokeLinecap="round"/>
              
              <rect x="250" y="70" width="60" height="8" rx="4" fill="#e2e8f0"/>
              <rect x="250" y="84" width="45" height="6" rx="3" fill="#f1f5f9"/>
            </svg>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="text-xs text-slate-400 z-10">
          © {new Date().getFullYear()} ONYX HEALTH+. Secure & HIPAA Compliant.
        </div>
      </div>

      {/* Right Pane: Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-slate-50">
        {/* Soft background ambient lights for mobile */}
        <div className="lg:hidden absolute top-0 left-0 w-80 h-80 rounded-full bg-[#35B7C9]/5 blur-3xl -translate-x-1/3 -translate-y-1/3"></div>
        <div className="lg:hidden absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#F2052C]/5 blur-3xl translate-x-1/3 translate-y-1/3"></div>

        <div className="w-full max-w-md z-10">
          
          {/* Badge above Card */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#35B7C9]/10 text-[#35B7C9] border border-[#35B7C9]/20 uppercase tracking-wider">
              <Heart className="h-3.5 w-3.5" />
              HEALTH PORTAL
            </span>
          </div>

          <Card className="border border-slate-100 bg-white shadow-xl shadow-slate-200/50 rounded-[24px] overflow-hidden p-6 sm:p-8">
            <CardHeader className="space-y-2 p-0 text-center">
              <div className="flex justify-center items-center gap-2 mb-2">
                <div className="h-10 w-10 rounded-xl bg-[#F2052C] flex items-center justify-center text-white shadow-md shadow-[#F2052C]/20">
                  <Heart className="h-5 w-5" />
                </div>
                <span className="font-extrabold text-lg tracking-tight text-slate-800">
                  ONYX <span className="text-[#35B7C9]">HEALTH+</span>
                </span>
              </div>
              <CardTitle className="text-2xl font-black text-slate-800">Health Portal</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Access your appointments, health records and healthcare services.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 mt-8 p-0">
              
              {/* Step 1: Phone Input */}
              {step === "phone" && (
                <div className="space-y-4">
                  <div className="space-y-1 text-left">
                    <Label className="text-xs font-bold text-slate-700 ml-1">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                      <Input
                        type="tel"
                        placeholder="Enter Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading || sendingOtp}
                        className="rounded-xl border border-slate-200 bg-slate-50 h-12 pl-12 pr-5 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#35B7C9] focus-visible:border-[#35B7C9] transition-all"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSendOtp}
                    className="w-full bg-[#F2052C] hover:bg-[#F2052C]/90 text-white font-bold h-12 rounded-xl transition-all shadow-md shadow-[#F2052C]/15"
                    disabled={sendingOtp || !phone}
                  >
                    {sendingOtp ? "Sending OTP..." : "Get Verification Code"}
                  </Button>
                </div>
              )}

              {/* Step 2: Verify */}
              {step === "verify" && (
                <div className="space-y-4">
                  <div className="space-y-1 text-left">
                    <Label className="text-xs font-bold text-slate-700 ml-1">Verification Code (OTP)</Label>
                    <Input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-5 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#35B7C9] focus-visible:border-[#35B7C9] transition-all"
                    />
                  </div>

                  {mode === "admin" && (
                    <>
                      <div className="space-y-1 text-left">
                        <Label className="text-xs font-bold text-slate-700 ml-1">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="rounded-xl border border-slate-200 bg-slate-50 h-12 pl-12 pr-12 text-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#35B7C9] focus-visible:border-[#35B7C9] transition-all"
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
                          className="text-xs font-bold text-[#F2052C] hover:text-[#F2052C]/80 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </>
                  )}

                  <Button
                    onClick={handleVerify}
                    className="w-full bg-[#F2052C] hover:bg-[#F2052C]/90 text-white font-bold h-12 rounded-xl transition-all shadow-md shadow-[#F2052C]/15"
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

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md rounded-[20px] p-6 border-none shadow-2xl">
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
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 ml-1">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                    <Input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      disabled={forgotLoading}
                      className="rounded-xl border border-slate-200 bg-slate-50 h-12 pl-12 pr-5 text-sm focus-visible:ring-2 focus-visible:ring-[#F2052C] focus-visible:border-[#F2052C]"
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
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 ml-1">OTP</Label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    disabled={forgotLoading}
                    className="rounded-xl border border-slate-200 bg-slate-50 h-12 px-5 text-sm focus-visible:ring-2 focus-visible:ring-[#F2052C] focus-visible:border-[#F2052C]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 ml-1">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                    <Input
                      type="password"
                      placeholder="Enter new password (min 8 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={forgotLoading}
                      className="rounded-xl border border-slate-200 bg-slate-50 h-12 pl-12 pr-5 text-sm focus-visible:ring-2 focus-visible:ring-[#F2052C] focus-visible:border-[#F2052C]"
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
