"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getEpisodePlayback } from "@/features/playback/api/playback-api";

type HlsLevel = {
  height?: number;
  bitrate?: number;
  name?: string;
};

type HlsErrorData = {
  fatal?: boolean;
  type?: string;
  details?: string;
};

type HlsInstance = {
  levels: HlsLevel[];
  currentLevel: number;
  loadSource: (source: string) => void;
  attachMedia: (media: HTMLMediaElement) => void;
  destroy: () => void;
  on: (
    eventName: string,
    callback: (eventName: string, data?: unknown) => void,
  ) => void;
};

type HlsConstructor = {
  isSupported: () => boolean;
  Events: {
    MANIFEST_PARSED: string;
    ERROR: string;
  };
  new (config?: Record<string, unknown>): HlsInstance;
};

type WindowWithHls = Window &
  typeof globalThis & {
    Hls?: HlsConstructor;
  };

type SignedHlsPlayerProps = {
  episodeId: string;
  viewerId?: string;
  compact?: boolean;
};

let hlsScriptPromise: Promise<void> | null = null;

function isHlsUrl(url: string) {
  return /\.m3u8($|\?)/i.test(url);
}

function loadHlsScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const windowWithHls = window as WindowWithHls;

  if (windowWithHls.Hls) {
    return Promise.resolve();
  }

  if (!hlsScriptPromise) {
    hlsScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-hls-js="true"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), {
          once: true,
        });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.async = true;
      script.dataset.hlsJs = "true";
      script.onload = () => resolve();
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  return hlsScriptPromise;
}

function formatLevel(level: HlsLevel, index: number) {
  if (level.name) {
    return level.name;
  }

  if (level.height) {
    return `${level.height}p`;
  }

  if (level.bitrate) {
    return `${Math.round(level.bitrate / 1000)} kbps`;
  }

  return `Level ${index + 1}`;
}

export function SignedHlsPlayer({
  episodeId,
  viewerId,
  compact = false,
}: SignedHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const retryCountRef = useRef(0);
  const lastPlaybackTimeRef = useRef(0);
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["episode-playback", episodeId, viewerId ?? "anonymous"] as const,
    [episodeId, viewerId],
  );
  const storageKey = useMemo(
    () => `talex.watch-position.${episodeId}`,
    [episodeId],
  );
  const [levels, setLevels] = useState<HlsLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const playbackQuery = useQuery({
    queryKey,
    queryFn: () => getEpisodePlayback(episodeId, viewerId),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const playbackUrl =
    playbackQuery.data?.hlsUrl ||
    playbackQuery.data?.playbackUrl ||
    playbackQuery.data?.manifestUrl ||
    "";

  const refreshPlayback = useCallback(() => {
    const currentTime = videoRef.current?.currentTime;

    if (typeof currentTime === "number" && Number.isFinite(currentTime)) {
      lastPlaybackTimeRef.current = currentTime;
    }

    setPlayerError(null);
    retryCountRef.current = 0;
    void queryClient.refetchQueries({ queryKey, exact: true });
  }, [queryClient, queryKey]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !playbackUrl) {
      return;
    }

    let hls: HlsInstance | null = null;
    let disposed = false;

    function restorePosition() {
      if (!video) {
        return;
      }

      const storedPosition = Number(localStorage.getItem(storageKey) || 0);
      const position =
        lastPlaybackTimeRef.current > 0
          ? lastPlaybackTimeRef.current
          : storedPosition;

      if (
        Number.isFinite(position) &&
        position > 0 &&
        (!video.duration || position < video.duration - 5)
      ) {
        video.currentTime = position;
      }
    }

    function persistPosition() {
      if (!video || !Number.isFinite(video.currentTime)) {
        return;
      }

      localStorage.setItem(storageKey, String(Math.floor(video.currentTime)));
    }

    function handleFatalError(data?: unknown) {
      const hlsError = data as HlsErrorData | undefined;
      setPlayerError(
        hlsError?.details
          ? `Playback error: ${hlsError.details}`
          : "Playback URL expired or stream failed.",
      );

      if (retryCountRef.current < 2) {
        retryCountRef.current += 1;
        const currentTime = videoRef.current?.currentTime;

        if (typeof currentTime === "number" && Number.isFinite(currentTime)) {
          lastPlaybackTimeRef.current = currentTime;
        }

        void queryClient.refetchQueries({ queryKey, exact: true });
      }
    }

    setPlayerError(null);
    setLevels([]);
    setSelectedLevel(-1);
    video.addEventListener("loadedmetadata", restorePosition);
    video.addEventListener("timeupdate", persistPosition);

    if (!isHlsUrl(playbackUrl)) {
      video.src = playbackUrl;

      return () => {
        video.removeEventListener("loadedmetadata", restorePosition);
        video.removeEventListener("timeupdate", persistPosition);
        video.removeAttribute("src");
        video.load();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playbackUrl;

      return () => {
        video.removeEventListener("loadedmetadata", restorePosition);
        video.removeEventListener("timeupdate", persistPosition);
        video.removeAttribute("src");
        video.load();
      };
    }

    loadHlsScript()
      .then(() => {
        if (disposed || !videoRef.current) {
          return;
        }

        const Hls = (window as WindowWithHls).Hls;

        if (!Hls?.isSupported()) {
          video.src = playbackUrl;
          return;
        }

        hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!hls) {
            return;
          }

          setLevels(hls.levels ?? []);
        });
        hls.on(Hls.Events.ERROR, (_eventName, data) => {
          const hlsError = data as HlsErrorData | undefined;

          if (hlsError?.fatal) {
            handleFatalError(hlsError);
          }
        });
        hls.loadSource(playbackUrl);
        hls.attachMedia(videoRef.current);
      })
      .catch(() => {
        if (!disposed) {
          video.src = playbackUrl;
        }
      });

    return () => {
      disposed = true;
      video.removeEventListener("loadedmetadata", restorePosition);
      video.removeEventListener("timeupdate", persistPosition);
      hls?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [playbackUrl, queryClient, queryKey, storageKey]);

  function handleQualityChange(value: string) {
    const nextLevel = Number(value);
    setSelectedLevel(nextLevel);

    if (hlsRef.current) {
      hlsRef.current.currentLevel = nextLevel;
    }
  }

  const errorMessage = playerError || playbackQuery.error?.message;

  return (
    <div
      className={
        compact
          ? "w-full"
          : "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
      }
    >
      <div
        className={
          compact
            ? "overflow-hidden rounded-xl bg-black"
            : "overflow-hidden rounded-2xl bg-black shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
        }
      >
        <div className="relative bg-black">
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            poster={playbackQuery.data?.thumbnailUrl}
            className="aspect-video w-full bg-black object-contain"
          />

          {playbackQuery.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#10151E] px-4 py-3 text-sm text-white sm:px-5">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="h-4 w-4 text-[#7DD3FC]" />
            <span>
              {playbackQuery.data?.protectionType === "NONE"
                ? "Public playback"
                : "Signed playback"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {levels.length > 1 && (
              <label className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black">
                <Gauge className="h-4 w-4" />
                <select
                  value={selectedLevel}
                  onChange={(event) => handleQualityChange(event.target.value)}
                  className="bg-transparent text-white outline-none"
                >
                  <option value={-1} className="bg-[#10151E]">
                    Auto
                  </option>
                  {levels.map((level, index) => (
                    <option
                      key={`${level.height ?? level.bitrate ?? index}-${index}`}
                      value={index}
                      className="bg-[#10151E]"
                    >
                      {formatLevel(level, index)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={refreshPlayback}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-[#10151E]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh URL
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#FFD8D4] bg-[#FFF7F6] p-4 text-sm font-bold text-[#B42318]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={refreshPlayback}
              className="mt-3 rounded-full bg-[#B42318] px-4 py-2 text-xs font-black text-white"
            >
              Retry Playback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
