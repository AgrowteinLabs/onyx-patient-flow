import { useState, useEffect, useCallback } from "react";

/**
 * A reusable hook to manage OTP resend cooldown timer.
 * Default cooldown is 30 seconds.
 */
export const useOtpTimer = (initialSeconds = 30) => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Start timer
  const start = useCallback(() => {
    setSecondsLeft(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  // Reset timer manually (optional)
  const reset = useCallback(() => {
    setSecondsLeft(0);
    setIsActive(false);
  }, []);

  // Countdown logic
  useEffect(() => {
    if (!isActive || secondsLeft <= 0) {
      if (secondsLeft <= 0) setIsActive(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, secondsLeft]);

  return { secondsLeft, isActive, start, reset };
};

export default useOtpTimer;
