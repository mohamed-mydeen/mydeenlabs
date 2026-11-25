import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TIMEOUT_MINUTES = 10;
const WARNING_WINDOW_SECONDS = 60;

function getConfiguredTimeoutMs(): number {
  const raw = Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES);
  const minutes = Number.isFinite(raw) && raw >= 2 ? raw : DEFAULT_TIMEOUT_MINUTES;
  return minutes * 60 * 1000;
}

export interface InactivityState {
  showWarning: boolean;
  secondsRemaining: number;
  stayLoggedIn: () => void;
}

/**
 * Tracks genuine user interactions (mouse, keyboard, touch, scroll, route changes)
 * and triggers a 60-second warning modal before automatically signing out.
 */
export function useInactivityTimeout(
  enabled: boolean,
  onTimeout: () => void | Promise<void>
): InactivityState {
  const location = useLocation();
  const timeoutMs = getConfiguredTimeoutMs();
  const warningMs = WARNING_WINDOW_SECONDS * 1000;

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_WINDOW_SECONDS);

  const lastActivityRef = useRef<number>(Date.now());
  const timedOutRef = useRef<boolean>(false);
  const showWarningRef = useRef<boolean>(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    timedOutRef.current = false;
    if (showWarningRef.current) {
      showWarningRef.current = false;
      setShowWarning(false);
    }
    setSecondsRemaining(WARNING_WINDOW_SECONDS);
  }, []);

  // Reset on navigation activity
  useEffect(() => {
    if (enabled) {
      resetTimer();
    }
  }, [location.pathname, enabled, resetTimer]);

  useEffect(() => {
    if (!enabled) {
      setShowWarning(false);
      showWarningRef.current = false;
      return;
    }

    lastActivityRef.current = Date.now();
    timedOutRef.current = false;

    let lastThrottle = 0;
    const handleActivity = () => {
      // Do not auto-dismiss warning on accidental mouse wiggle; require explicit "Stay Logged In"
      if (showWarningRef.current) return;
      const now = Date.now();
      if (now - lastThrottle < 1000) return;
      lastThrottle = now;
      lastActivityRef.current = now;
    };

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remainingMs = timeoutMs - elapsed;

      if (remainingMs <= 0) {
        if (!timedOutRef.current) {
          timedOutRef.current = true;
          showWarningRef.current = false;
          setShowWarning(false);
          void onTimeoutRef.current();
        }
        return;
      }

      if (remainingMs <= warningMs) {
        if (!showWarningRef.current) {
          showWarningRef.current = true;
          setShowWarning(true);
        }
        setSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)));
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      window.clearInterval(interval);
    };
  }, [enabled, timeoutMs, warningMs]);

  return {
    showWarning,
    secondsRemaining,
    stayLoggedIn: resetTimer,
  };
}
