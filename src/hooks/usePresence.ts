import { useEffect, useState, useCallback } from "react";
import { presenceService, IncomingCallPayload } from "@/services/presence.service";

export function usePresence() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    presenceService.connect();

    const unbindConnected = presenceService.on("connected", () => {
      setIsConnected(true);
    });

    return () => {
      unbindConnected();
    };
  }, []);

  const notifyDoctor = useCallback((payload: IncomingCallPayload) => {
    return presenceService.notifyDoctorIncomingCall(payload);
  }, []);

  return {
    isConnected,
    notifyDoctor,
    presenceService,
  };
}
