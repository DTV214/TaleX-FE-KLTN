import {
  type CSSProperties,
  type DragEvent,
  type MouseEvent,
  useEffect,
  useState,
} from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Loader2 } from "lucide-react";

interface WatermarkedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  mediaId: string;
  fallbackUrl?: string;
}

const isAntiPiracyEnabled = () =>
  typeof window === "undefined" || sessionStorage.getItem("antiPiracyDisabled") !== "true";

export function WatermarkedImage({
  mediaId,
  fallbackUrl,
  className,
  style,
  onDragStart,
  onContextMenu,
  ...props
}: WatermarkedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [antiPiracyEnabled, setAntiPiracyEnabled] = useState(true);
  const { user } = useAuthStore();
  const accountId = user?.accountId;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setAntiPiracyEnabled(isAntiPiracyEnabled());
    });

    const handleAntiPiracyToggle = (event: Event) => {
      const { detail } = event as CustomEvent<{ isDisabled?: boolean }>;
      setAntiPiracyEnabled(detail?.isDisabled !== true);
    };

    window.addEventListener("talex:anti-piracy-toggle", handleAntiPiracyToggle);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("talex:anti-piracy-toggle", handleAntiPiracyToggle);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let url: string | null = null;

    const fetchAndWatermark = async () => {
      try {
        setIsLoading(true);
        if (!fallbackUrl) {
          throw new Error("No fallbackUrl provided");
        }

        // Tải dữ liệu ảnh dưới dạng Blob qua Proxy (đảm bảo không bị CORS/Tainted Canvas trên Deploy)
        let blob: Blob | null = null;
        if (fallbackUrl.startsWith("http")) {
          try {
            const proxyRes = await fetch(`/api/image-proxy?url=${encodeURIComponent(fallbackUrl)}`);
            if (proxyRes.ok) {
              blob = await proxyRes.blob();
            }
          } catch (e) {
            console.warn("[watermark] Proxy fetch failed, trying direct fetch:", e);
          }
        }

        if (!blob) {
          try {
            const directRes = await fetch(fallbackUrl, { mode: "cors" });
            if (directRes.ok) {
              blob = await directRes.blob();
            }
          } catch (e) {
            console.warn("[watermark] Direct fetch failed:", e);
          }
        }

        if (!blob) {
          throw new Error("Could not fetch image blob for canvas watermarking");
        }

        const tempBlobUrl = URL.createObjectURL(blob);
        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("Failed to decode blob image into HTMLImageElement"));
          img.src = tempBlobUrl;
        });

        if (!isMounted) {
          URL.revokeObjectURL(tempBlobUrl);
          return;
        }

        // Vẽ lên Canvas
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("Could not get canvas context");

        // Vẽ ảnh gốc
        ctx.drawImage(img, 0, 0);

        // Vẽ Viewer ID (Watermark nổi)
        if (accountId) {
          ctx.globalCompositeOperation = "difference"; // Trộn màu tương phản
          ctx.fillStyle = "rgba(255, 255, 255, 0.02)"; // Độ mờ 2% chuẩn
          ctx.font = "bold 40px sans-serif";
          const textToDraw = `${accountId}`;
          if (canvas.height > 400) {
            const y1 = 100 + Math.random() * (canvas.height / 2 - 200);
            const x1 = 50 + Math.random() * Math.max(0, canvas.width - 600);
            ctx.fillText(textToDraw, x1, y1);

            const y2 = (canvas.height / 2) + Math.random() * (canvas.height / 2 - 100);
            const x2 = 50 + Math.random() * Math.max(0, canvas.width - 600);
            ctx.fillText(textToDraw, x2, y2);
          } else {
            ctx.fillText(textToDraw, 10, canvas.height / 2);
          }

          ctx.globalCompositeOperation = "source-over";
        }

        // Vẽ Logo Website mờ ở giữa (luôn hiển thị để đánh dấu bản quyền)
        ctx.globalCompositeOperation = "difference";
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)"; // Độ mờ 6% chuẩn
        ctx.font = "bold 60px sans-serif";
        const brandText = "talex.pro.vn";
        const brandMetrics = ctx.measureText(brandText);
        
        // Xoay chéo chữ lên trên bên phải (-30 độ)
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((-30 * Math.PI) / 180);
        ctx.fillText(brandText, -brandMetrics.width / 2, 0);
        ctx.restore();
        
        ctx.globalCompositeOperation = "source-over";

        // --- Nhúng LSB (Least Significant Bit) ---
        if (accountId) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const textToHide = `${accountId}`;
          const textBytes = new TextEncoder().encode(textToHide);
          const bits: number[] = [];

          for (let i = 0; i < textBytes.length; i++) {
            for (let b = 0; b < 8; b++) {
              bits.push((textBytes[i] >> b) & 1);
            }
          }

          for (let i = 0; i < bits.length; i++) {
            if (i * 4 < imageData.data.length) {
              imageData.data[i * 4] = (imageData.data[i * 4] & ~1) | bits[i];
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }

        // Chuyển Canvas thành Blob để làm src cho <img>
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(tempBlobUrl);
          if (blob && isMounted) {
            url = URL.createObjectURL(blob);
            setObjectUrl(url);
            setIsLoading(false);
          }
        }, "image/png");

      } catch (err: unknown) {
        console.error("Error creating watermarked canvas:", err);
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    fetchAndWatermark();

    return () => {
      isMounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [mediaId, accountId, fallbackUrl]);

  const srcToUse = error || (!objectUrl && fallbackUrl) ? fallbackUrl : objectUrl;

  if (isLoading && !srcToUse) {
    return (
      <div className={`flex items-center justify-center bg-black/50 ${className}`} style={style}>
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!srcToUse) {
    return <div className={`bg-red-900/20 ${className}`} style={style} />;
  }

  const protectedStyle: CSSProperties = {
    ...style,
    userSelect: "none",
    WebkitUserSelect: "none",
  };

  const handleDragStart = (event: DragEvent<HTMLImageElement>) => {
    if (antiPiracyEnabled) {
      event.preventDefault();
    }
    onDragStart?.(event);
  };

  const handleContextMenu = (event: MouseEvent<HTMLImageElement>) => {
    if (antiPiracyEnabled) {
      event.preventDefault();
    }
    onContextMenu?.(event);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Watermarking needs a canvas-generated blob URL.
    <img
      {...props}
      src={srcToUse}
      alt={props.alt ?? ""}
      className={`${className ?? ""} select-none`}
      style={protectedStyle}
      draggable={!antiPiracyEnabled}
      onDragStart={handleDragStart}
      onContextMenu={handleContextMenu}
    />
  );
}
