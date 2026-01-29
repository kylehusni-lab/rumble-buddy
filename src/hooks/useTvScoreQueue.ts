import { useState, useCallback, useRef, useEffect } from "react";

export interface ScoreEvent {
  id: string;
  points: number;
  playerName: string;
}

const DISPLAY_DURATION = 2500; // 2s visible + 0.5s exit animation
const GAP_BETWEEN_POPUPS = 500; // 0.5s gap between popups

export function useTvScoreQueue() {
  const [currentPopup, setCurrentPopup] = useState<ScoreEvent | null>(null);
  const queueRef = useRef<ScoreEvent[]>([]);
  const isShowingRef = useRef(false);

  const showNextPopup = useCallback(() => {
    if (queueRef.current.length === 0) {
      isShowingRef.current = false;
      return;
    }

    isShowingRef.current = true;
    const next = queueRef.current.shift()!;
    setCurrentPopup(next);

    // Schedule next popup after display + gap
    setTimeout(() => {
      setCurrentPopup(null);
      setTimeout(() => {
        showNextPopup();
      }, GAP_BETWEEN_POPUPS);
    }, DISPLAY_DURATION);
  }, []);

  const addScoreEvent = useCallback(
    (points: number, playerName: string) => {
      const event: ScoreEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        points,
        playerName,
      };

      queueRef.current.push(event);

      // Start showing if not already showing
      if (!isShowingRef.current) {
        showNextPopup();
      }
    },
    [showNextPopup]
  );

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setCurrentPopup(null);
    isShowingRef.current = false;
  }, []);

  return {
    currentPopup,
    addScoreEvent,
    clearQueue,
  };
}
