import { useEffect } from "react";
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

export function useHeartbeat(
  episodeId: string,
  videoRef: React.RefObject<HTMLVideoElement | null>
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episodeId) return;

    // Use closure-scoped local variables for session state tracking (replaces React refs)
    const sessionId = generateSessionId();
    let hasSentView = false;
    let hasSentFirstEvent = false;
    let watchedAccumulator = 0;
    let lastCurrentTime = video.currentTime;
    let isPlaying = false;

    const sendViewRequest = async () => {
      if (hasSentView) return;
      hasSentView = true;
      try {
        await recordEpisodeView(episodeId, sessionId);
      } catch (err) {
        console.error("Failed to record view:", err);
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
        console.error(`Failed to send watch progress event ${event}:`, err);
      }
    };

    const handlePlay = () => {
      isPlaying = true;
      lastCurrentTime = video.currentTime;
      if (!hasSentView) {
        void sendViewRequest();
      }
    };

    const handlePause = () => {
      isPlaying = false;
    };

    const handleEnded = () => {
      isPlaying = false;
      const accumulated = watchedAccumulator;
      if (accumulated > 0) {
        void sendWatchProgress("last_event", video.currentTime, accumulated);
        watchedAccumulator = 0;
      }
    };

    const handleTimeUpdate = () => {
      if (!isPlaying || document.visibilityState !== "visible") {
        lastCurrentTime = video.currentTime;
        return;
      }

      const currentTime = video.currentTime;
      const diff = currentTime - lastCurrentTime;

      if (diff > 0 && diff < 1.5) {
        watchedAccumulator += diff;
      } else if (diff < 0) {
        watchedAccumulator = 0;
      }

      lastCurrentTime = currentTime;

      if (watchedAccumulator >= HEARTBEAT_INTERVAL_SEC) {
        const eventType = hasSentFirstEvent ? "heartbeat" : "first_event";
        hasSentFirstEvent = true;

        const accumulated = watchedAccumulator;
        watchedAccumulator = 0;

        void sendWatchProgress(eventType, currentTime, accumulated);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        lastCurrentTime = video.currentTime;
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (!video.paused) {
      handlePlay();
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      const accumulated = watchedAccumulator;
      if (accumulated > 0) {
        void sendWatchProgress("last_event", video.currentTime, accumulated);
      }
    };
  }, [episodeId, videoRef]);
}
