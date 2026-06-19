import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Download, AlertTriangle } from "lucide-react";
import {
  cardRequestOtp,
  cardVerify,
  AbdmError
} from "@/services/abdm.service";

interface AbdmCardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
  onSuccess: () => void;
}

export const AbdmCardDialog: React.FC<AbdmCardDialogProps> = ({
  isOpen,
  onOpenChange,
  profileId,
  profileName,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // States
  const [txnId, setTxnId] = useState("");
  const [otp, setOtp] = useState("");
  const [cardPng, setCardPng] = useState<string | null>(null);

  const resetState = () => {
    setOtpSent(false);
    setTxnId("");
    setOtp("");
    setCardPng(null);
    setInlineError(null);
  };

  const handleOpenChangeInternal = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const requestOtp = useCallback(async () => {
    setLoading(true);
    setInlineError(null);
    setCardPng(null);
    try {
      const res = await cardRequestOtp(profileId);
      setTxnId(res.txnId);
      setOtpSent(true);
    } catch (err: any) {
      const abdmErr = err as AbdmError;
      console.error("Card Request OTP Error:", abdmErr);
      setInlineError(abdmErr.error || "Failed to trigger re-authentication OTP.");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  // Automatically trigger OTP request when the modal opens
  useEffect(() => {
    if (isOpen) {
      requestOtp();
    }
  }, [isOpen, requestOtp]);

  const verifyOtp = async () => {
    if (!otp) {
      setInlineError("Please enter the OTP code.");
      return;
    }

    setLoading(true);
    setInlineError(null);
    try {
      const res = await cardVerify(profileId, txnId, otp);
      setCardPng(res.cardPng);
      
      // If the ABHA status flipped to DEACTIVATED, refresh parent profiles page
      if (res.abhaStatus === "DEACTIVATED") {
        toast({
          title: "ABHA Deactivated",
          description: "This health account has been deactivated nationally.",
          variant: "destructive",
        });
        onSuccess();
      }
    } catch (err: any) {
      const abdmErr = err as AbdmError;
      console.error("Card Verify OTP Error:", abdmErr);
      
      // Branch on HTTP status as per Section 7 & 9
      if (abdmErr.httpStatus === 422) {
        setInlineError("Incorrect OTP. Please check the code and try again.");
      } else if (abdmErr.httpStatus === 400 && (abdmErr.code === "OTP_FAILED" || abdmErr.code === "ABDM-1017")) {
        setInlineError("OTP has expired. Please click 'Resend OTP' to request a new code.");
      } else if (abdmErr.httpStatus === 502) {
        setInlineError("Failed to fetch card from ABDM gate. Please request a new OTP and try again.");
      } else {
        setInlineError(abdmErr.error || "Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!cardPng) return;
    try {
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${cardPng}`;
      link.download = `abha-card-${profileName.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Card Downloaded",
        description: "The ABHA card image has been saved successfully.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Download Failed",
        description: "Could not download the card image.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="sm:max-w-md rounded-[24px] p-6 border-none shadow-2xl overflow-hidden bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#0ea5e9]/10 to-[#2563eb]/10 border flex items-center justify-center text-[#2563eb]">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <DialogTitle className="text-slate-800 font-extrabold text-xl text-center">
            {cardPng ? "ABHA Digital Health Card" : "ABHA Verification"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs text-center px-4">
            {cardPng 
              ? `National health card for ${profileName}. Kept secure and view-only.` 
              : "Confirming identity with a secure transaction code for security compliance."
            }
          </DialogDescription>
        </DialogHeader>

        {/* Global Inline Error Banner */}
        {inlineError && (
          <div className="mx-2 mt-2 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium leading-relaxed">
            {inlineError}
          </div>
        )}

        <div className="py-4 px-2 flex flex-col items-center justify-center min-h-[120px]">
          {loading && !otpSent && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-[#2563eb] animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Contacting ABDM Gateway...</span>
            </div>
          )}

          {otpSent && !cardPng && (
            <div className="w-full space-y-4 text-left">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="card-otp" className="text-xs font-bold text-slate-700">Enter OTP *</Label>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={requestOtp}
                    className="text-xs font-bold text-[#2563eb] hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
                <Input
                  id="card-otp"
                  placeholder="Enter verification code"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setInlineError(null);
                  }}
                  className="rounded-xl border border-slate-200 tracking-wider text-center"
                />
                <span className="text-[10px] text-slate-400 block mt-1 leading-normal">
                  For your privacy, we require a fresh OTP confirmation every time you view this card.
                </span>
              </div>
            </div>
          )}

          {cardPng && (
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="p-2 border border-slate-100 bg-slate-50/50 rounded-2xl shadow-sm flex items-center justify-center max-w-full overflow-hidden select-none">
                <img
                  src={`data:image/png;base64,${cardPng}`}
                  alt="ABHA Card"
                  className="rounded-lg object-contain w-full max-h-64 shadow-sm"
                  onContextMenu={(e) => e.preventDefault()} // prevent right-click copy/save
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-amber-50/30 border border-amber-100/50 p-2.5 rounded-xl text-center max-w-xs">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>For security, this card is not persisted on your device storage.</span>
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
            Close
          </Button>

          {otpSent && !cardPng && (
            <Button
              type="button"
              disabled={loading}
              onClick={verifyOtp}
              className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Verify & View
            </Button>
          )}

          {cardPng && (
            <Button
              type="button"
              onClick={handleDownload}
              className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <Download className="h-3.5 w-3.5" />
              Download Card
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
