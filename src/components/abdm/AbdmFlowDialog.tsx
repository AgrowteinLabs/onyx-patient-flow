import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, Smartphone, Fingerprint, Users, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  createRequestOtp,
  createVerify,
  connectRequestOtp,
  connectVerify,
  connectSelect,
  AbdmError
} from "@/services/abdm.service";

interface AbdmFlowDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
  onSuccess: () => void;
}

type FlowStep =
  | "choice"
  | "create_input"
  | "create_otp"
  | "connect_input"
  | "connect_otp"
  | "connect_select";

export const AbdmFlowDialog: React.FC<AbdmFlowDialogProps> = ({
  isOpen,
  onOpenChange,
  profileId,
  profileName,
  onSuccess
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<FlowStep>("choice");
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Flow State Variables
  const [choice, setChoice] = useState<"create" | "connect">("create");
  const [txnId, setTxnId] = useState("");
  const [otp, setOtp] = useState("");

  // Create Flow state
  const [aadhaar, setAadhaar] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [communicationMobile, setCommunicationMobile] = useState("");

  // Connect Flow state
  const [identifierType, setIdentifierType] = useState<"abha-number" | "aadhaar" | "mobile">("abha-number");
  const [identifier, setIdentifier] = useState("");
  const [accounts, setAccounts] = useState<Array<{ abhaNumber: string; name: string; abhaStatus: string }>>([]);
  const [selectedAbhaNumber, setSelectedAbhaNumber] = useState("");

  const resetState = () => {
    setStep("choice");
    setTxnId("");
    setOtp("");
    setAadhaar("");
    setConsentChecked(false);
    setCommunicationMobile("");
    setIdentifierType("abha-number");
    setIdentifier("");
    setAccounts([]);
    setSelectedAbhaNumber("");
    setInlineError(null);
  };

  const handleOpenChangeInternal = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  // Helper to extract clean error message
  const handleAbdmError = (err: any, customMessage: string) => {
    const abdmErr = err as AbdmError;
    console.error("ABDM API Error:", abdmErr);
    
    if (abdmErr.error) {
      setInlineError(abdmErr.error);
    } else {
      setInlineError(customMessage);
    }
  };

  /* =========================================================
     CREATE FLOW LOGIC
     ========================================================= */
  const handleCreateRequestOtp = async () => {
    if (aadhaar.length !== 12 || !/^\d+$/.test(aadhaar)) {
      setInlineError("Aadhaar must be exactly 12 digits.");
      return;
    }
    if (!consentChecked) {
      setInlineError("You must agree to the consent terms to proceed.");
      return;
    }

    setLoading(true);
    setInlineError(null);
    try {
      const res = await createRequestOtp(profileId, aadhaar);
      setTxnId(res.txnId);
      setStep("create_otp");
      setOtp("");
    } catch (err: any) {
      const abdmErr = err as AbdmError;
      if (abdmErr.httpStatus === 409 && abdmErr.code === "HIS-3005") {
        setInlineError("This Aadhaar does not have a linked mobile number in UIDAI records. You cannot create a new ABHA. Please link a mobile number or choose 'Connect' if you already have an ABHA.");
      } else {
        handleAbdmError(err, "Failed to request Aadhaar OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVerify = async () => {
    if (!otp) {
      setInlineError("Please enter the OTP.");
      return;
    }
    if (communicationMobile.length !== 10 || !/^\d+$/.test(communicationMobile)) {
      setInlineError("Please enter a valid 10-digit communication mobile number.");
      return;
    }

    setLoading(true);
    setInlineError(null);
    try {
      const res = await createVerify(profileId, txnId, otp, communicationMobile);
      toast({
        title: res.alreadyExisted
          ? "Aadhaar already had an ABHA"
          : "ABHA Linked Successfully",
        description: res.alreadyExisted
          ? `Linked existing ABHA ${res.abhaNumber} to your profile.`
          : `Created and linked ABHA ${res.abhaNumber} to your profile.`,
      });
      onSuccess();
      handleOpenChangeInternal(false);
    } catch (err: any) {
      const abdmErr = err as AbdmError;
      // Wrong OTP vs Expired OTP branching as per Section 7 & 9
      if (abdmErr.httpStatus === 422) {
        setInlineError("Incorrect OTP. Please enter the code sent to your Aadhaar-linked mobile again.");
      } else if (abdmErr.httpStatus === 400 && (abdmErr.code === "ABDM-1017" || abdmErr.code === "OTP_FAILED")) {
        setInlineError("Aadhaar OTP session has expired. Please click 'Resend OTP' to send a new code.");
      } else {
        handleAbdmError(err, "Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResendOtp = async () => {
    setLoading(true);
    setInlineError(null);
    try {
      const res = await createRequestOtp(profileId, aadhaar);
      setTxnId(res.txnId);
      setOtp("");
      toast({
        title: "OTP Resent",
        description: "A fresh OTP has been sent to your Aadhaar-linked mobile.",
      });
    } catch (err) {
      handleAbdmError(err, "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CONNECT FLOW LOGIC
     ========================================================= */
  const handleConnectRequestOtp = async () => {
    if (!identifier.trim()) {
      setInlineError(`Please enter your ${identifierType === "abha-number" ? "ABHA Number" : identifierType === "aadhaar" ? "Aadhaar" : "Mobile Number"}.`);
      return;
    }

    setLoading(true);
    setInlineError(null);
    try {
      const res = await connectRequestOtp(profileId, identifierType, identifier.trim());
      setTxnId(res.txnId);
      setStep("connect_otp");
      setOtp("");
    } catch (err) {
      handleAbdmError(err, "Failed to request verification OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectVerify = async () => {
    if (!otp) {
      setInlineError("Please enter the OTP.");
      return;
    }

    setLoading(true);
    setInlineError(null);
    try {
      const res = await connectVerify(profileId, txnId, otp);
      if (res.requiresSelection && res.accounts && res.accounts.length > 0) {
        setAccounts(res.accounts);
        setTxnId(res.txnId || txnId);
        setSelectedAbhaNumber(res.accounts[0].abhaNumber);
        setStep("connect_select");
      } else if (res.abhaNumber) {
        toast({
          title: "ABHA Connected",
          description: `Successfully linked ABHA ${res.abhaNumber} to your profile.`,
        });
        onSuccess();
        handleOpenChangeInternal(false);
      } else {
        throw new Error("No linked ABHA returned.");
      }
    } catch (err: any) {
      const abdmErr = err as AbdmError;
      // Wrong OTP vs Expired OTP branching as per Section 7 & 9
      if (abdmErr.httpStatus === 422) {
        setInlineError("Incorrect OTP. Please check the code and try again.");
      } else if (abdmErr.httpStatus === 400 && (abdmErr.code === "OTP_FAILED" || abdmErr.code === "ABDM-1017")) {
        setInlineError("OTP has expired. Please click 'Resend OTP' to request a new code.");
      } else if (abdmErr.httpStatus === 409 && abdmErr.code === "NO_ACTIVE_ABHA") {
        setInlineError("No active ABHA accounts were found for this number.");
      } else {
        handleAbdmError(err, "Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectResendOtp = async () => {
    setLoading(true);
    setInlineError(null);
    try {
      const res = await connectRequestOtp(profileId, identifierType, identifier.trim());
      setTxnId(res.txnId);
      setOtp("");
      toast({
        title: "OTP Resent",
        description: "A fresh verification code has been sent.",
      });
    } catch (err) {
      handleAbdmError(err, "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSelect = async () => {
    if (!selectedAbhaNumber) {
      setInlineError("Please select an ABHA account.");
      return;
    }

    setLoading(true);
    setInlineError(null);
    try {
      const res = await connectSelect(profileId, txnId, selectedAbhaNumber);
      toast({
        title: "ABHA Connected",
        description: `Successfully linked ABHA ${res.abhaNumber} to your profile.`,
      });
      onSuccess();
      handleOpenChangeInternal(false);
    } catch (err: any) {
      const abdmErr = err as AbdmError;
      if (abdmErr.httpStatus === 409 && abdmErr.code === "DEACTIVATED") {
        setInlineError("The selected ABHA is deactivated nationally. Please select another account.");
      } else {
        handleAbdmError(err, "Failed to link selected ABHA.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="sm:max-w-md rounded-[24px] p-6 border-none shadow-2xl overflow-hidden bg-white/95 backdrop-blur-md">
        <DialogHeader className="relative">
          {step !== "choice" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setInlineError(null);
                if (step === "create_input" || step === "connect_input") setStep("choice");
                if (step === "create_otp") setStep("create_input");
                if (step === "connect_otp") setStep("connect_input");
                if (step === "connect_select") setStep("connect_otp");
              }}
              className="absolute left-0 top-0 size-8 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex justify-center mb-2 mt-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#0ea5e9]/10 to-[#2563eb]/10 border flex items-center justify-center text-[#2563eb]">
              <Shield className="h-6 w-6" />
            </div>
          </div>

          <DialogTitle className="text-slate-800 font-extrabold text-xl text-center">
            {step === "choice" && `Link ABHA ID`}
            {step === "create_input" && "Create a new ABHA"}
            {step === "create_otp" && "Verify Aadhaar OTP"}
            {step === "connect_input" && "Connect Existing ABHA"}
            {step === "connect_otp" && "Enter Verification OTP"}
            {step === "connect_select" && "Select ABHA Account"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs text-center px-4">
            {step === "choice" && `Integrate India's Ayushman Bharat Digital Mission (ABDM) identity for ${profileName}.`}
            {step === "create_input" && "Generate a unique national health ID using your Aadhaar number."}
            {step === "create_otp" && "Enter the secure verification code sent to your Aadhaar-linked mobile."}
            {step === "connect_input" && "Use your existing ABHA number or linked documents to connect."}
            {step === "connect_otp" && "Enter the OTP sent to your ABHA verification channel."}
            {step === "connect_select" && "Choose which active health account to link to this profile."}
          </DialogDescription>
        </DialogHeader>

        {/* Global Inline Error Banner */}
        {inlineError && (
          <div className="mx-2 mt-2 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium leading-relaxed">
            {inlineError}
          </div>
        )}

        <div className="py-4 px-2 space-y-4">
          {/* =========================================================
             STEP 1: CHOICE SCREEN
             ========================================================= */}
          {step === "choice" && (
            <div className="space-y-4">
              <div
                onClick={() => setChoice("create")}
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-4 ${
                  choice === "create"
                    ? "border-[#2563eb] bg-[#2563eb]/5 shadow-sm"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${choice === "create" ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-500"}`}>
                  <Fingerprint className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-slate-800 text-sm">Create a new ABHA</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">Use your Aadhaar to generate a new secure digital health account instantly.</p>
                </div>
              </div>

              <div
                onClick={() => setChoice("connect")}
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-4 ${
                  choice === "connect"
                    ? "border-[#2563eb] bg-[#2563eb]/5 shadow-sm"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${choice === "connect" ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-500"}`}>
                  <Smartphone className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-slate-800 text-sm">Connect an existing ABHA</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">Link an already registered ABHA card via number, Aadhaar, or mobile OTP.</p>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
             CREATE FLOW: INPUT
             ========================================================= */}
          {step === "create_input" && (
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="aadhaar" className="text-xs font-bold text-slate-700">Aadhaar Number *</Label>
                <Input
                  id="aadhaar"
                  placeholder="Enter 12-digit Aadhaar number"
                  maxLength={12}
                  value={aadhaar}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setAadhaar(val);
                    setInlineError(null);
                  }}
                  className="rounded-xl border border-slate-200 text-sm tracking-widest text-center"
                />
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => {
                    setConsentChecked(checked === true);
                    setInlineError(null);
                  }}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-[10px] text-slate-500 leading-normal select-none cursor-pointer">
                  I hereby authorize Onyx Health+ to verify my Aadhaar credentials through UIDAI for the purpose of creating and linking my ABHA (Ayushman Bharat Health Account) under the Ayushman Bharat Digital Mission (ABDM). I understand that this information will not be saved or reused for any other purpose.
                </label>
              </div>
            </div>
          )}

          {/* =========================================================
             CREATE FLOW: OTP VERIFY
             ========================================================= */}
          {step === "create_otp" && (
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="create-otp" className="text-xs font-bold text-slate-700">Enter OTP *</Label>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCreateResendOtp}
                    className="text-xs font-bold text-[#2563eb] hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
                <Input
                  id="create-otp"
                  placeholder="Enter OTP sent to your mobile"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setInlineError(null);
                  }}
                  className="rounded-xl border border-slate-200 tracking-wider text-center"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="communication-mobile" className="text-xs font-bold text-slate-700">Communication Mobile Number *</Label>
                <Input
                  id="communication-mobile"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  value={communicationMobile}
                  onChange={(e) => {
                    setCommunicationMobile(e.target.value.replace(/\D/g, ""));
                    setInlineError(null);
                  }}
                  className="rounded-xl border border-slate-200 text-sm text-center"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">This will be registered as your communication mobile with ABDM.</span>
              </div>
            </div>
          )}

          {/* =========================================================
             CONNECT FLOW: INPUT
             ========================================================= */}
          {step === "connect_input" && (
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Select Identifier Type *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={identifierType === "abha-number" ? "default" : "outline"}
                    onClick={() => { setIdentifierType("abha-number"); setIdentifier(""); }}
                    className="rounded-xl text-[11px] font-bold h-9"
                  >
                    ABHA Number
                  </Button>
                  <Button
                    type="button"
                    variant={identifierType === "aadhaar" ? "default" : "outline"}
                    onClick={() => { setIdentifierType("aadhaar"); setIdentifier(""); }}
                    className="rounded-xl text-[11px] font-bold h-9"
                  >
                    Aadhaar ID
                  </Button>
                  <Button
                    type="button"
                    variant={identifierType === "mobile" ? "default" : "outline"}
                    onClick={() => { setIdentifierType("mobile"); setIdentifier(""); }}
                    className="rounded-xl text-[11px] font-bold h-9"
                  >
                    Mobile Phone
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="rounded-xl text-[11px] font-bold h-9 opacity-50 relative group cursor-not-allowed"
                  >
                    ABHA Address
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[8px] font-medium py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                      M1 Deferred
                    </span>
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-bold text-slate-700">
                  {identifierType === "abha-number" && "ABHA Number *"}
                  {identifierType === "aadhaar" && "Aadhaar Number *"}
                  {identifierType === "mobile" && "Mobile Number *"}
                </Label>
                <Input
                  id="identifier"
                  placeholder={
                    identifierType === "abha-number"
                      ? "e.g. 91-1234-5678-9012"
                      : identifierType === "aadhaar"
                      ? "Enter 12-digit Aadhaar ID"
                      : "Enter 10-digit Mobile number"
                  }
                  value={identifier}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (identifierType === "aadhaar" || identifierType === "mobile") {
                      val = val.replace(/\D/g, "");
                    }
                    setIdentifier(val);
                    setInlineError(null);
                  }}
                  className="rounded-xl border border-slate-200 text-sm text-center"
                />
              </div>
            </div>
          )}

          {/* =========================================================
             CONNECT FLOW: OTP VERIFY
             ========================================================= */}
          {step === "connect_otp" && (
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="connect-otp" className="text-xs font-bold text-slate-700">Enter OTP *</Label>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleConnectResendOtp}
                    className="text-xs font-bold text-[#2563eb] hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
                <Input
                  id="connect-otp"
                  placeholder="Enter OTP sent to your device"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setInlineError(null);
                  }}
                  className="rounded-xl border border-slate-200 tracking-wider text-center"
                />
              </div>
            </div>
          )}

          {/* =========================================================
             CONNECT FLOW: MULTI-ACCOUNT SELECT
             ========================================================= */}
          {step === "connect_select" && (
            <div className="space-y-3">
              <div className="max-h-48 overflow-y-auto space-y-2 p-1">
                {accounts.map((acc) => (
                  <div
                    key={acc.abhaNumber}
                    onClick={() => {
                      setSelectedAbhaNumber(acc.abhaNumber);
                      setInlineError(null);
                    }}
                    className={`p-3 border rounded-xl cursor-pointer flex items-center justify-between text-xs transition-all ${
                      selectedAbhaNumber === acc.abhaNumber
                        ? "border-[#2563eb] bg-[#2563eb]/5"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-slate-800 block text-sm">{acc.name}</span>
                      <span className="text-slate-400 block mt-0.5">ABHA: {acc.abhaNumber}</span>
                    </div>
                    {selectedAbhaNumber === acc.abhaNumber && (
                      <CheckCircle2 className="h-4.5 w-4.5 text-[#2563eb]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-slate-50 gap-2 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleOpenChangeInternal(false)}
            className="rounded-xl border-slate-200 font-bold w-full sm:w-auto"
          >
            Continue without ABHA
          </Button>

          {step === "choice" && (
            <Button
              type="button"
              onClick={() => setStep(choice === "create" ? "create_input" : "connect_input")}
              className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold rounded-xl w-full sm:w-auto"
            >
              Next
            </Button>
          )}

          {step === "create_input" && (
            <Button
              type="button"
              disabled={loading}
              onClick={handleCreateRequestOtp}
              className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Request OTP
            </Button>
          )}

          {step === "create_otp" && (
            <Button
              type="button"
              disabled={loading}
              onClick={handleCreateVerify}
              className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Verify & Link
            </Button>
          )}

          {step === "connect_input" && (
            <Button
              type="button"
              disabled={loading}
              onClick={handleConnectRequestOtp}
              className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Request OTP
            </Button>
          )}

          {step === "connect_otp" && (
            <Button
              type="button"
              disabled={loading}
              onClick={handleConnectVerify}
              className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Verify & Link
            </Button>
          )}

          {step === "connect_select" && (
            <Button
              type="button"
              disabled={loading}
              onClick={handleConnectSelect}
              className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Link Account
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
