import { useEffect, useRef } from "react";
import { recordEpisodeView, recordWatchProgress } from "../api/playback-api";

const HEARTBEAT_INTERVAL_SEC = 5;

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function useComicHeartbeat(
  episodeId: string,
  currentPage: number,
  totalPages: number,
  readingMode: "vertical" | "horizontal"
) {
  const currentPageRef = useRef(currentPage);
  const totalPagesRef = useRef(totalPages);
  const readingModeRef = useRef(readingMode);

  // Keep references fresh to avoid stale closures in the interval tick
  useEffect(() => {
    currentPageRef.current = currentPage;
    totalPagesRef.current = totalPages;
    readingModeRef.current = readingMode;
  }, [currentPage, totalPages, readingMode]);

  useEffect(() => {
    if (!episodeId) return;

    // Use closure-scoped local variables for tracking states (removes redundant react ref hooks)
    const sessionId = generateSessionId();
    let hasSentView = false;
    let hasSentFirstEvent = false;
    let watchedAccumulator = 0;

    const sendViewRequest = async () => {
      if (hasSentView) return;
      hasSentView = true;
      try {
        await recordEpisodeView(episodeId, sessionId);
      } catch (err) {
        console.error("Failed to record comic view:", err);
      }
    };

    const sendWatchProgress = async (
      event: "first_event" | "heartbeat" | "last_event",
      position: number,
      value: number
    ) => {
      try {
        await recordWatchProgress({
          event,
          session_id: sessionId,
          episode_id: episodeId,
          current_position: position,
          heartbeat_value: Math.round(value),
        });
      } catch (err) {
        console.error(`Failed to send comic reading progress ${event}:`, err);
      }
    };

    void sendViewRequest();

    const getEstimatedCurrentPage = () => {
      if (readingModeRef.current === "horizontal") {
        return currentPageRef.current + 1;
      }
      
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return 1;

      const scrollRatio = window.scrollY / scrollHeight;
      const total = totalPagesRef.current;
      return Math.min(total, Math.max(1, Math.round(scrollRatio * (total - 1)) + 1));
    };

    const intervalId = setInterval(() => {
      if (document.visibilityState !== "visible") return;

      watchedAccumulator += 1;

      if (watchedAccumulator >= HEARTBEAT_INTERVAL_SEC) {
        const eventType = hasSentFirstEvent ? "heartbeat" : "first_event";
        hasSentFirstEvent = true;

        const accumulated = watchedAccumulator;
        watchedAccumulator = 0;

        const estimatedPage = getEstimatedCurrentPage();
        void sendWatchProgress(eventType, estimatedPage, accumulated);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);

      const accumulated = watchedAccumulator;
      if (accumulated > 0) {
        const estimatedPage = getEstimatedCurrentPage();
        void sendWatchProgress("last_event", estimatedPage, accumulated);
      }
    };
  }, [episodeId]);
}
