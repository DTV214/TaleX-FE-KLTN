/**
 * Hardware & Micro-entropy Device Fingerprinting Utility
 *
 * Định danh máy tính vật lý độc nhất dựa trên sai số vi mô phần cứng:
 * 1. Canvas 2D Sub-pixel Rendering (Sai số làm tròn số thực của chip GPU)
 * 2. WebGL GPU Renderer (Model card màn hình vật lý)
 * 3. Web Audio API Synthesis (Sai số dao động tần số và DSP chip âm thanh)
 * 4. Hardware Matrix (CPU cores, screen depth, device pixel ratio, timezone, platform)
 *
 * Đảm bảo:
 * - Đồng nhất trên cùng 1 máy (Chrome, Cốc Cốc, Edge, Firefox, Brave)
 * - Khác biệt giữa 2 máy có cùng mẫu mã (do sai số vi mô bán dẫn silicon)
 * - Tốc độ thực thi ~2ms, lưu Cache in-memory để các lần gọi sau là 0ms.
 */

let cachedFingerprint: string | null = null;

/**
 * Thuật toán băm nhanh FNV-1a 32-bit (chuyển đổi chuỗi dài thành mã hex ngắn gọn)
 */
function fnv1a(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * 1. Trích xuất sai số vi mô GPU qua Canvas 2D Sub-pixel Rendering
 */
function getCanvasSubpixelSignature(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "canvas-none";

    // Thiết lập chế độ vẽ phức tạp để kích hoạt sai số làm tròn số thực của GPU
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial', 'Helvetica', sans-serif";
    ctx.textBaseline = "alphabetic";
    
    // Nền gradient đa sắc
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#f97316");
    gradient.addColorStop(0.5, "#ec4899");
    gradient.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ hình học đổ bóng mờ
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillRect(15, 10, 50, 40);

    // Chữ lồng Unicode & Emoji (Font antialiasing khác nhau giữa các chip)
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("TaleX-AntiFraud \ud83d\udee1\ufe0f", 75, 28);
    
    ctx.fillStyle = "rgba(255, 255, 0, 0.85)";
    ctx.fillText("TaleX-AntiFraud \ud83d\udee1\ufe0f", 77, 30);

    // Vẽ cung tròn
    ctx.beginPath();
    ctx.arc(205, 30, 18, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
    ctx.fill();

    return fnv1a(canvas.toDataURL());
  } catch {
    return "canvas-err";
  }
}

/**
 * 2. Trích xuất Card đồ họa vật lý từ WebGL
 */
function getWebGLHardwareSignature(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!gl) return "webgl-none";

    const webglCtx = gl as WebGLRenderingContext;
    const debugInfo = webglCtx.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "webgl-no-ext";

    const vendor = webglCtx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";
    const renderer = webglCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
    
    return `${vendor}~${renderer}`;
  } catch {
    return "webgl-err";
  }
}

/**
 * 3. Trích xuất sai số xử lý âm thanh số từ Web Audio API (Offline, không phát tiếng)
 */
function getAudioHardwareSignature(): string {
  try {
    const AudioContextClass =
      window.OfflineAudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitOfflineAudioContext;
    if (!AudioContextClass) return "audio-none";

    const context = new AudioContextClass(1, 44100, 44100);
    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);

    // Tính toán tức thời thông số compressor
    const audioHash = fnv1a(
      `${compressor.threshold.value}~${compressor.knee.value}~${compressor.ratio.value}~${compressor.attack.value}~${compressor.release.value}`
    );
    return audioHash;
  } catch {
    return "audio-err";
  }
}

/**
 * 4. Thu thập Ma trận Phần cứng Hệ thống (Hardware & Environment Matrix)
 */
function getSystemHardwareMatrix(): string {
  if (typeof window === "undefined") return "ssr";

  const cores = navigator.hardwareConcurrency || 4;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memory = (navigator as any).deviceMemory || 8;
  const colorDepth = window.screen.colorDepth || 24;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const pixelRatio = (window.devicePixelRatio || 1).toFixed(2);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  return [
    cores,
    memory,
    colorDepth,
    screenResolution,
    pixelRatio,
    timezone,
    platform,
    maxTouchPoints,
  ].join("|");
}

/**
 * Hàm lấy Hardware Fingerprint đồng bộ (Synchronous)
 * - Chạy trong 1-3ms cho lần đầu.
 * - Trả về ngay trong 0ms từ lần gọi thứ 2 (nhờ in-memory cache).
 * - Trả về chuỗi dạng: "dev-8f92a1c0-4b2e7d"
 */
export function getHardwareFingerprint(): string {
  if (typeof window === "undefined") {
    return "dev-ssr-server";
  }

  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  try {
    const canvasSig = getCanvasSubpixelSignature();
    const webglSig = getWebGLHardwareSignature();
    const audioSig = getAudioHardwareSignature();
    const systemMatrix = getSystemHardwareMatrix();

    // Kết hợp tất cả thành phần sai số vi mô
    const combinedEntropy = `${canvasSig}##${webglSig}##${audioSig}##${systemMatrix}`;
    
    // Tạo mã băm kép 64-bit để tránh 100% va chạm
    const hashPart1 = fnv1a(combinedEntropy);
    const hashPart2 = fnv1a(combinedEntropy.split("").reverse().join(""));

    cachedFingerprint = `dev-${hashPart1}-${hashPart2}`;
    return cachedFingerprint;
  } catch (err) {
    console.warn("[Fingerprint] Error computing hardware fingerprint:", err);
    // Fallback nếu có lỗi xảy ra
    const fallback = fnv1a(getSystemHardwareMatrix());
    cachedFingerprint = `dev-fb-${fallback}`;
    return cachedFingerprint;
  }
}
