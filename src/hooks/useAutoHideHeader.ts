import { useState, useEffect, useCallback } from "react";

const HIDE_DELAY = 5000; // 5 seconds

export function useAutoHideHeader() {
  const [isVisible, setIsVisible] = useState(true);

  const showHeader = useCallback(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      setIsVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsVisible(false), HIDE_DELAY);
    };

    const events = ["mousemove", "keydown", "click", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Initial timer
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return { isVisible, showHeader };
}
