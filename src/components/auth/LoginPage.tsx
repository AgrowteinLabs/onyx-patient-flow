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
import { Activity, Eye, EyeOff } from "lucide-react";
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

  const [mode, setMode] = useState<"admin" | "patient">("admin");
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#dcedf9]">
      {/* Background Decorative Shapes */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-[#c850c0] to-[#ffcc70] opacity-80 mix-blend-multiply blur-2xl"></div>
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-gradient-to-bl from-[#a1c4fd] to-[#c2e9fb] opacity-60 translate-x-1/4 -translate-y-1/4"></div>

      {/* Main Login Card */}
      <Card className="w-full max-w-sm mx-4 gradient-login-card border-none shadow-2xl rounded-[30px] z-10 relative overflow-hidden p-2 text-center text-[#2d3748]">
        <CardHeader className="space-y-1 mt-4">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 rounded-full bg-[#eb4e4e] flex items-center justify-center shadow-md">
              {/* Note: Replacing Activity with a Heart icon to match screenshot closely, using a custom SVG for heart if needed, or lucide Heart */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-sm font-bold text-[#eb4e4e] tracking-widest uppercase">Onyx Health+</CardTitle>
          <h2 className="text-3xl font-extrabold text-[#2d3748] mt-2 mb-1">Log In</h2>
          <CardDescription className="text-[#4a5568] text-xs font-medium">Access your health dashboard</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 mt-4">
          {/* Role Selector */}
          <div className="flex justify-center gap-2 mb-2 bg-white/30 p-1 rounded-full w-fit mx-auto">
            <button
              onClick={() => setMode("admin")}
              disabled={loading}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${mode === "admin" ? "bg-white text-[#681da8] shadow-sm" : "text-gray-700 hover:text-gray-900"}`}
            >
              Admin
            </button>
            <button
              onClick={() => setMode("patient")}
              disabled={loading}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${mode === "patient" ? "bg-white text-[#681da8] shadow-sm" : "text-gray-700 hover:text-gray-900"}`}
            >
              Patient
            </button>
          </div>

          {/* Step 1: Phone Input */}
          {step === "phone" && (
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <Label className="text-[10px] font-bold text-gray-700 ml-3 uppercase tracking-wider">Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="Enter your Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading || sendingOtp}
                  className="rounded-full bg-white border-none shadow-inner h-12 px-5 text-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#eb4e4e]"
                />
              </div>
              <Button
                onClick={handleSendOtp}
                className="w-full gradient-login-btn rounded-full h-12 shadow-lg text-white font-bold tracking-wide hover:opacity-90 transition-opacity"
                disabled={sendingOtp || !phone}
              >
                {sendingOtp ? "Sending OTP..." : "Log in"}
              </Button>
            </div>
          )}

          {/* Step 2: Verify */}
          {step === "verify" && (
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <Label className="text-[10px] font-bold text-gray-700 ml-3 uppercase tracking-wider">OTP</Label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  className="rounded-full bg-white border-none shadow-inner h-12 px-5 text-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#eb4e4e]"
                />
              </div>

              {mode === "admin" && (
                <>
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-gray-700 ml-3 uppercase tracking-wider">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="rounded-full bg-white border-none shadow-inner h-12 px-5 pr-12 text-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#eb4e4e]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                      className="text-xs font-bold text-[#eb4e4e] hover:underline transition-colors mr-2"
                    >
                      Forgot password?
                    </button>
                  </div>
                </>
              )}

              <Button
                onClick={handleVerify}
                className="w-full gradient-login-btn rounded-full h-12 shadow-lg text-white font-bold tracking-wide hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Confirm Login"}
              </Button>

              <button
                type="button"
                className="w-full text-xs font-bold text-gray-600 hover:text-gray-900 mt-2"
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
                    timer > 0 ? "text-gray-400 cursor-not-allowed" : "text-[#eb4e4e] hover:underline"
                  )}
                >
                  {timer > 0 ? `Resend OTP in ${timer}s` : "Didn't receive code? Resend OTP"}
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decorative Bottom Left Icons */}
      <div className="absolute bottom-8 left-8 grid grid-cols-2 gap-4 opacity-80 z-20">
        <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
           <path d="M14.5 1.5c-1.3 1.3-2 3.1-2 4.9v.6h-2v-.6c0-1.8-.7-3.6-2-4.9l1.4-1.4c1.7 1.7 2.6 4 2.6 6.3h2c0-2.3.9-4.6 2.6-6.3l-1.4-1.4zM20 10v9c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-9c0-3.3 2.7-6 6-6 1.1 0 2.2.3 3.1.8.9-.5 2-.8 3.1-.8 3.3 0 6 2.7 6 6zm-2 0c0-2.2-1.8-4-4-4-1.5 0-2.8.8-3.5 2h-1c-.7-1.2-2-2-3.5-2-2.2 0-4 1.8-4 4v9h16v-9z"/>
        </svg>
        <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.5 21C5.1 21 4 19.9 4 18.5V9.4C4 8.1 5.1 7 6.5 7h11C18.9 7 20 8.1 20 9.4v9.1c0 1.4-1.1 2.5-2.5 2.5h-11zM6.5 9C6.2 9 6 9.2 6 9.4v9.1C6 18.8 6.2 19 6.5 19h11c.3 0 .5-.2.5-.5V9.4C18 9.2 17.8 9 17.5 9h-11z M10 11h4v2h-4v-2z M10 15h4v2h-4v-2z"/>
        </svg>
        <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4-9H8v-2h8v2z"/>
        </svg>
      </div>

      {/* Decorative Bottom Right Action Button */}
      <div className="absolute bottom-8 right-8 z-20">
        <div className="h-14 w-14 rounded-2xl bg-[#eb4e4e] flex items-center justify-center shadow-lg text-white">
           <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
           </svg>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md rounded-[20px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#eb4e4e] font-bold text-xl">Reset Password</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              {forgotPasswordStep === "phone"
                ? "Enter your mobile number to receive a reset OTP."
                : "Enter the OTP sent to your phone and your new password."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {forgotPasswordStep === "phone" ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-gray-700 ml-3 uppercase tracking-wider">Mobile Number</Label>
                  <Input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    disabled={forgotLoading}
                    className="rounded-full bg-gray-50 border-none shadow-inner h-12 px-5 text-sm focus-visible:ring-1 focus-visible:ring-[#eb4e4e]"
                  />
                </div>
                <Button
                  onClick={handleForgotRequestOtp}
                  className="w-full gradient-login-btn rounded-full h-12 shadow-lg text-white font-bold"
                  disabled={forgotLoading || !forgotPhone}
                >
                  {forgotLoading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-gray-700 ml-3 uppercase tracking-wider">OTP</Label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    disabled={forgotLoading}
                    className="rounded-full bg-gray-50 border-none shadow-inner h-12 px-5 text-sm focus-visible:ring-1 focus-visible:ring-[#eb4e4e]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-gray-700 ml-3 uppercase tracking-wider">New Password</Label>
                  <Input
                    type="password"
                    placeholder="Enter new password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={forgotLoading}
                    className="rounded-full bg-gray-50 border-none shadow-inner h-12 px-5 text-sm focus-visible:ring-1 focus-visible:ring-[#eb4e4e]"
                  />
                </div>
                <Button
                  onClick={handleForgotResetPassword}
                  className="w-full gradient-login-btn rounded-full h-12 shadow-lg text-white font-bold"
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
                      forgotTimer > 0 ? "text-gray-400 cursor-not-allowed" : "text-[#eb4e4e] hover:underline"
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
