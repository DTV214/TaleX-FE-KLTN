"use client";

import type Hls from "hls.js";
import type { ErrorData, HlsConfig, Level } from "hls.js";
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { cn } from "@/shared/utils/utils";
import { useHeartbeat } from "../hooks/useHeartbeat";

type QualitySelection = "auto" | number;

type QualityOption = {
  label: string;
  levelIndex: number;
  height?: number;
  bitrate?: number;
  sourceUrl?: string;
};

type NativeFullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

type HlsVideoPlayerProps = {
  episodeId: string;
  manifestUrl: string;
  posterUrl?: string | null;
  compact?: boolean;
  className?: string;
  storageKey?: string;
  realDuration?: number;
  isLocked?: boolean;
  onFatalError?: (message: string) => void;
  onEnded?: () => void;
};

/**
 * Extract CloudFront signature query params from a signed URL.
 * These params need to be forwarded to all HLS sub-requests (playlists + segments).
 */
function extractSignatureParams(url: string): string {
  try {
    const urlObj = new URL(url);
    const sigParams = ["Policy", "Signature", "Key-Pair-Id", "Expires"];
    const parts: string[] = [];
    for (const key of sigParams) {
      const val = urlObj.searchParams.get(key);
      if (val) parts.push(`${key}=${encodeURIComponent(val)}`);
    }
    return parts.length > 0 ? parts.join("&") : "";
  } catch {
    return "";
  }
}

function buildHlsConfig(manifestUrl: string): Partial<HlsConfig> {
  const sigQuery = extractSignatureParams(manifestUrl);
  return {
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 10,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    startLevel: -1,
    testBandwidth: true,
    capLevelToPlayerSize: true,
    abrEwmaDefaultEstimate: 4_500_000,
    // Forward CloudFront signature to HLS sub-requests that lack signature
    ...(sigQuery
      ? {
          xhrSetup: (xhr: XMLHttpRequest, url: string) => {
            // Skip if URL already contains signature params (e.g. master playlist)
            if (url.includes("Key-Pair-Id=") || url.includes("Policy=")) {
              return;
            }
            const separator = url.includes("?") ? "&" : "?";
            xhr.open("GET", url + separator + sigQuery, true);
          },
        }
      : {}),
  };
}

const HLS_CONFIG: Partial<HlsConfig> = {
  enableWorker: true,
  lowLatencyMode: false,
  backBufferLength: 10,
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  startLevel: -1,
  testBandwidth: true,
  capLevelToPlayerSize: true,
  abrEwmaDefaultEstimate: 4_500_000,
};
const DEFAULT_ABR_ESTIMATE = HLS_CONFIG.abrEwmaDefaultEstimate ?? 4_500_000;

function isHlsManifest(url: string) {
  return /\.m3u8($|\?)/i.test(url);
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatQualityLabel(
  level: Pick<Level, "height" | "bitrate" | "name">,
  fallbackIndex: number,
) {
  if (level.height > 0) {
    return `${level.height}p`;
  }

  if (level.name) {
    return level.name;
  }

  if (level.bitrate > 0) {
    return `${Math.round(level.bitrate / 1000)} kbps`;
  }

  return `Level ${fallbackIndex + 1}`;
}

function sortQualityOptions(options: QualityOption[]) {
  return [...options].sort((left, right) => {
    const leftHeight = left.height ?? 0;
    const rightHeight = right.height ?? 0;

    if (leftHeight !== rightHeight) {
      return rightHeight - leftHeight;
    }

    return (right.bitrate ?? 0) - (left.bitrate ?? 0);
  });
}

function buildQualityOptionsFromLevels(levels: Level[]) {
  const byResolution = new Map<string, QualityOption>();

  levels.forEach((level, index) => {
    const label = formatQualityLabel(level, index);
    const key = level.height > 0 ? String(level.height) : label;
    const current = byResolution.get(key);
    const next: QualityOption = {
      label,
      levelIndex: index,
      height: level.height || undefined,
      bitrate: level.bitrate || undefined,
    };

    if (!current || (next.bitrate ?? 0) > (current.bitrate ?? 0)) {
      byResolution.set(key, next);
    }
  });

  return sortQualityOptions(Array.from(byResolution.values()));
}

function parseAttributes(value: string) {
  const attributes: Record<string, string> = {};
  const regex = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/g;
  let match = regex.exec(value);

  while (match) {
    attributes[match[1]] = match[2].replace(/^"|"$/g, "");
    match = regex.exec(value);
  }

  return attributes;
}

function parseManifestQualityOptions(manifestUrl: string, manifestText: string) {
  const lines = manifestText.split(/\r?\n/);
  const options: QualityOption[] = [];
  const baseUrl = new URL(manifestUrl, window.location.href);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line.startsWith("#EXT-X-STREAM-INF:")) {
      continue;
    }

    const attributes = parseAttributes(line.slice("#EXT-X-STREAM-INF:".length));
    const resolution = attributes.RESOLUTION;
    const height = resolution
      ? Number(resolution.split("x")[1] ?? 0)
      : undefined;
    const bitrate = Number(attributes.BANDWIDTH ?? 0) || undefined;
    let sourceUrl: string | undefined;

    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      const nextLine = lines[nextIndex].trim();

      if (!nextLine || nextLine.startsWith("#")) {
        continue;
      }

      sourceUrl = new URL(nextLine, baseUrl).toString();
      break;
    }

    if (!sourceUrl) {
      continue;
    }

    options.push({
      label:
        height && height > 0
          ? `${height}p`
          : bitrate
            ? `${Math.round(bitrate / 1000)} kbps`
            : `Level ${options.length + 1}`,
      levelIndex: options.length,
      height,
      bitrate,
      sourceUrl,
    });
  }

  const byResolution = new Map<string, QualityOption>();

  options.forEach((option) => {
    const key = option.height ? String(option.height) : option.label;
    const current = byResolution.get(key);

    if (!current || (option.bitrate ?? 0) > (current.bitrate ?? 0)) {
      byResolution.set(key, option);
    }
  });

  return sortQualityOptions(Array.from(byResolution.values()));
}

async function loadNativeQualityOptions(manifestUrl: string) {
  const response = await fetch(manifestUrl);

  if (!response.ok) {
    return [];
  }

  const manifestText = await response.text();

  if (!manifestText.includes("#EXT-X-STREAM-INF")) {
    return [];
  }

  return parseManifestQualityOptions(manifestUrl, manifestText);
}

function pickPreferredAutoStartLevel(levels: Level[], video: HTMLVideoElement) {
  if (levels.length === 0) {
    return -1;
  }

  const devicePixelRatio =
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const renderedHeight = Math.max(video.clientHeight || 0, 360);
  const targetHeight = Math.max(
    480,
    Math.min(720, Math.round(renderedHeight * devicePixelRatio)),
  );
  const candidates = levels
    .map((level, index) => ({
      index,
      height: level.height || 0,
      bitrate: level.bitrate || 0,
    }))
    .sort((left, right) => {
      if (left.height !== right.height) {
        return left.height - right.height;
      }

      return left.bitrate - right.bitrate;
    });
  const underTarget = candidates.filter(
    (candidate) =>
      candidate.height === 0 ||
      candidate.height <= targetHeight ||
      candidate.bitrate <= DEFAULT_ABR_ESTIMATE,
  );
  const pool = underTarget.length > 0 ? underTarget : candidates;

  return pool[pool.length - 1]?.index ?? -1;
}

function getBufferedEnd(video: HTMLVideoElement) {
  if (!video.buffered.length) {
    return 0;
  }

  for (let index = 0; index < video.buffered.length; index += 1) {
    const start = video.buffered.start(index);
    const end = video.buffered.end(index);

    if (video.currentTime >= start && video.currentTime <= end) {
      return end;
    }
  }

  return video.buffered.end(video.buffered.length - 1);
}

export function HlsVideoPlayer({
  episodeId,
  manifestUrl,
  posterUrl,
  compact = false,
  className,
  storageKey,
  realDuration,
  isLocked,
  onFatalError,
  onEnded,
}: HlsVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Hook into video element for views & watch progress tracking
  useHeartbeat(episodeId, videoRef);
  const hlsRef = useRef<Hls | null>(null);
  const onFatalErrorRef = useRef(onFatalError);
  const selectedQualityRef = useRef<QualitySelection>("auto");
  const networkRecoveryCountRef = useRef(0);
  const mediaRecoveryCountRef = useRef(0);
  const lastPersistedSecondRef = useRef(-1);
  const restoredManifestRef = useRef<string | null>(null);

  const [levels, setLevels] = useState<Level[]>([]);
  const [nativeOptions, setNativeOptions] = useState<QualityOption[]>([]);
  const [selectedQuality, setSelectedQuality] =
    useState<QualitySelection>("auto");
  const [activeLevel, setActiveLevel] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);

  const qualityOptions = useMemo(
    () =>
      levels.length > 0 ? buildQualityOptionsFromLevels(levels) : nativeOptions,
    [levels, nativeOptions],
  );
  const selectedQualityLabel = useMemo(() => {
    if (selectedQuality === "auto") {
      const activeLabel =
        activeLevel >= 0 && levels[activeLevel]
          ? formatQualityLabel(levels[activeLevel], activeLevel)
          : null;

      return activeLabel ? `Auto (${activeLabel})` : "Auto";
    }

    return (
      qualityOptions.find((option) => option.levelIndex === selectedQuality)
        ?.label ?? "Manual"
    );
  }, [activeLevel, levels, qualityOptions, selectedQuality]);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
  const seekStyle = useMemo<CSSProperties>(
    () => ({
      background: `linear-gradient(to right, #FF2D55 0%, #FF2D55 ${progressPercent}%, rgba(255,255,255,0.45) ${progressPercent}%, rgba(255,255,255,0.45) ${bufferedPercent}%, rgba(255,255,255,0.22) ${bufferedPercent}%, rgba(255,255,255,0.22) 100%)`,
    }),
    [bufferedPercent, progressPercent],
  );

  useEffect(() => {
    onFatalErrorRef.current = onFatalError;
  }, [onFatalError]);

  useEffect(() => {
    selectedQualityRef.current = selectedQuality;
  }, [selectedQuality]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.volume = volume;
    video.muted = muted;
  }, [muted, volume]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !manifestUrl) {
      return;
    }

    const media = video;
    let disposed = false;

    function reportFatalError(message: string) {
      setIsBuffering(false);
      setSourceError(message);
      onFatalErrorRef.current?.(message);
    }

    function setDirectVideoSource(sourceUrl: string) {
      media.src = sourceUrl;
      media.load();
    }

    async function attachHlsSource() {
      setSourceError(null);
      setLevels([]);
      setNativeOptions([]);
      setActiveLevel(-1);
      setSelectedQuality("auto");
      selectedQualityRef.current = "auto";
      networkRecoveryCountRef.current = 0;
      mediaRecoveryCountRef.current = 0;
      lastPersistedSecondRef.current = -1;
      restoredManifestRef.current = null;
      setCurrentTime(0);
      setDuration(0);
      setBufferedEnd(0);
      setIsPlaying(false);
      setSettingsOpen(false);
      setIsBuffering(true);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      media.removeAttribute("src");
      media.load();

      if (!isHlsManifest(manifestUrl)) {
        setDirectVideoSource(manifestUrl);
        return;
      }

      const canUseNativeHls =
        Boolean(media.canPlayType("application/vnd.apple.mpegurl")) ||
        Boolean(media.canPlayType("application/x-mpegURL"));

      try {
        const HlsModule = await import("hls.js");
        const HlsConstructor = HlsModule.default;

        if (disposed) {
          return;
        }

        if (HlsConstructor.isSupported()) {
          const hls = new HlsConstructor(buildHlsConfig(manifestUrl));
          hlsRef.current = hls;
          hls.attachMedia(media);
          hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
            if (disposed) {
              return;
            }

            const parsedLevels = hls.levels ?? [];
            setLevels(parsedLevels);

            if (selectedQualityRef.current === "auto") {
              const preferredLevel = pickPreferredAutoStartLevel(
                parsedLevels,
                media,
              );

              if (preferredLevel >= 0) {
                hls.nextAutoLevel = preferredLevel;
              }
            }
          });
          hls.on(HlsConstructor.Events.LEVEL_SWITCHED, (_event, data) => {
            setActiveLevel(data.level);
          });
          hls.on(HlsConstructor.Events.ERROR, (_event, data: ErrorData) => {
            if (!data.fatal) {
              return;
            }

            if (
              data.type === HlsConstructor.ErrorTypes.NETWORK_ERROR &&
              networkRecoveryCountRef.current < 2
            ) {
              networkRecoveryCountRef.current += 1;
              hls.startLoad(media.currentTime || -1);
              return;
            }

            if (
              data.type === HlsConstructor.ErrorTypes.MEDIA_ERROR &&
              mediaRecoveryCountRef.current < 1
            ) {
              mediaRecoveryCountRef.current += 1;
              hls.recoverMediaError();
              return;
            }

            reportFatalError(
              data.details
                ? `Playback error: ${data.details}`
                : "Playback URL expired or stream failed.",
            );
          });
          hls.loadSource(manifestUrl);
          return;
        }
      } catch {
        hlsRef.current = null;
      }

      if (canUseNativeHls) {
        setDirectVideoSource(manifestUrl);
        loadNativeQualityOptions(manifestUrl)
          .then((options) => {
            if (!disposed) {
              setNativeOptions(options);
            }
          })
          .catch(() => {
            if (!disposed) {
              setNativeOptions([]);
            }
          });
        return;
      }

      reportFatalError("This browser cannot play this HLS stream.");
    }

    void attachHlsSource();

    return () => {
      disposed = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      media.removeAttribute("src");
      media.load();
    };
  }, [manifestUrl]);

  const syncBufferedState = useCallback((video: HTMLVideoElement) => {
    setBufferedEnd(getBufferedEnd(video));
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nativeDuration = Number.isFinite(video.duration) ? video.duration : 0;
    const nextDuration = realDuration && realDuration > 0 ? realDuration : nativeDuration;
    setDuration(nextDuration);
    syncBufferedState(video);

    if (!storageKey || restoredManifestRef.current === manifestUrl) {
      return;
    }

    restoredManifestRef.current = manifestUrl;
    const storedPosition = Number(localStorage.getItem(storageKey) || 0);

    if (
      Number.isFinite(storedPosition) &&
      storedPosition > 0 &&
      (!nextDuration || storedPosition < nextDuration - 5)
    ) {
      video.currentTime = storedPosition;
      setCurrentTime(storedPosition);
    }
  }, [manifestUrl, storageKey, syncBufferedState]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setCurrentTime(video.currentTime);
    syncBufferedState(video);

    if (!storageKey || !Number.isFinite(video.currentTime)) {
      return;
    }

    const currentSecond = Math.floor(video.currentTime);

    if (currentSecond !== lastPersistedSecondRef.current) {
      lastPersistedSecondRef.current = currentSecond;
      localStorage.setItem(storageKey, String(currentSecond));
    }
  }, [storageKey, syncBufferedState]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play().catch(() => {
        setSourceError("Playback could not start. Please try again.");
      });
      return;
    }

    video.pause();
  }, []);

  const handleSeek = useCallback((nextTime: number) => {
    const video = videoRef.current;

    if (!video || !Number.isFinite(nextTime)) {
      return;
    }

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const handleVolumeChange = useCallback((nextVolume: number) => {
    const video = videoRef.current;
    const normalizedVolume = Math.max(0, Math.min(1, nextVolume));

    setVolume(normalizedVolume);
    setMuted(normalizedVolume === 0);

    if (video) {
      video.volume = normalizedVolume;
      video.muted = normalizedVolume === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    const nextMuted = !muted;

    setMuted(nextMuted);

    if (video) {
      video.muted = nextMuted;
    }
  }, [muted]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current as NativeFullscreenVideo | null;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    if (container?.requestFullscreen) {
      void container.requestFullscreen();
      return;
    }

    video?.webkitEnterFullscreen?.();
  }, []);

  const switchNativeQuality = useCallback(
    (option: QualityOption | null) => {
      const video = videoRef.current;

      if (!video) {
        return;
      }

      const nextSource = option?.sourceUrl ?? manifestUrl;
      const wasPlaying = !video.paused;
      const seekTime = video.currentTime;

      video.addEventListener(
        "loadedmetadata",
        () => {
          if (Number.isFinite(seekTime) && seekTime > 0) {
            video.currentTime = seekTime;
          }

          if (wasPlaying) {
            void video.play().catch(() => undefined);
          }
        },
        { once: true },
      );
      video.src = nextSource;
      video.load();
    },
    [manifestUrl],
  );

  const selectQuality = useCallback(
    (nextSelection: QualitySelection) => {
      const video = videoRef.current;
      const hls = hlsRef.current;

      setSelectedQuality(nextSelection);
      selectedQualityRef.current = nextSelection;
      setSettingsOpen(false);

      if (hls) {
        if (nextSelection === "auto") {
          hls.currentLevel = -1;
          const preferredLevel = video
            ? pickPreferredAutoStartLevel(hls.levels, video)
            : -1;

          if (preferredLevel >= 0) {
            hls.nextAutoLevel = preferredLevel;
          }

          return;
        }

        hls.currentLevel = nextSelection;

        if (video) {
          hls.startLoad(video.currentTime || -1);
        }

        return;
      }

      if (nextSelection === "auto") {
        switchNativeQuality(null);
        return;
      }

      const option = qualityOptions.find(
        (qualityOption) => qualityOption.levelIndex === nextSelection,
      );
      switchNativeQuality(option ?? null);
    },
    [qualityOptions, switchNativeQuality],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden bg-black text-white",
        compact ? "rounded-xl" : "rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        poster={posterUrl ?? undefined}
        onClick={togglePlay}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={(event) => syncBufferedState(event.currentTarget)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onEnded={onEnded}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume);
          setMuted(event.currentTarget.muted);
        }}
        className="aspect-video w-full bg-black object-contain"
      >
        Your browser does not support the video tag.
      </video>

      {(isBuffering || !manifestUrl) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!isPlaying && !isBuffering && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition hover:bg-white"
          aria-label="Play"
        >
          <Play className="h-8 w-8 fill-current pl-1" />
        </button>
      )}

      {sourceError && (
        <div className="absolute inset-x-4 top-4 rounded-xl border border-red-300 bg-red-950/85 px-4 py-3 text-sm font-bold text-white shadow-xl">
          {sourceError}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-3 pb-3 pt-12 sm:px-4">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || currentTime)}
          onChange={(event) => handleSeek(Number(event.currentTarget.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#FF2D55]"
          style={seekStyle}
          aria-label="Seek"
        />

        <div className="mt-3 flex min-h-10 items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current pl-0.5" />
            )}
          </button>

          <div className="min-w-[88px] text-xs font-bold tabular-nums text-white/90 sm:min-w-[104px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step="0.05"
              value={muted ? 0 : volume}
              onChange={(event) =>
                handleVolumeChange(Number(event.currentTarget.value))
              }
              className="h-1.5 w-20 cursor-pointer accent-white"
              aria-label="Volume"
            />
          </div>

          <div className="flex-1" />

          <span className="hidden max-w-[132px] truncate text-xs font-black text-white/85 sm:block">
            {selectedQualityLabel}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>

            {settingsOpen && (
              <div className="absolute bottom-12 right-0 w-44 overflow-hidden rounded-xl border border-white/15 bg-[#181818] py-1 text-sm shadow-2xl">
                <button
                  type="button"
                  onClick={() => selectQuality("auto")}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-bold transition hover:bg-white/10",
                    selectedQuality === "auto" && "text-[#FF7A96]",
                  )}
                >
                  <span>Auto</span>
                  {selectedQuality === "auto" && (
                    <span className="text-xs">{selectedQualityLabel}</span>
                  )}
                </button>

                {qualityOptions.map((option) => (
                  <button
                    key={`${option.levelIndex}-${option.label}`}
                    type="button"
                    onClick={() => selectQuality(option.levelIndex)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-bold transition hover:bg-white/10",
                      selectedQuality === option.levelIndex &&
                        "text-[#FF7A96]",
                    )}
                  >
                    <span>{option.label}</span>
                    {selectedQuality === option.levelIndex && (
                      <span className="text-xs">On</span>
                    )}
                  </button>
                ))}

                {qualityOptions.length === 0 && (
                  <div className="px-3 py-2 text-xs font-bold text-white/55">
                    Auto only
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
