import { useState, useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/core/config/api";

interface WatermarkedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  mediaId: string;
  fallbackUrl?: string;
}

export function WatermarkedImage({ mediaId, fallbackUrl, className, ...props }: WatermarkedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuthStore();
  const accountId = user?.accountId;

  useEffect(() => {
    let isMounted = true;
    let url: string | null = null;
    
    const fetchAndWatermark = async () => {
      try {
        setIsLoading(true);
        if (!fallbackUrl) {
          throw new Error("No fallbackUrl provided");
        }

        // Tạo Image object để load ảnh
        const img = new Image();
        img.crossOrigin = "anonymous"; // Bắt buộc để tránh lỗi Tainted Canvas
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("Failed to load image for canvas"));
          
          // Dùng Next.js API Route proxy để vượt qua lỗi CORS của Cloudfront/S3
          img.src = `/api/image-proxy?url=${encodeURIComponent(fallbackUrl)}`;
        });

        if (!isMounted) return;

        // Vẽ lên Canvas
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) throw new Error("Could not get canvas context");
        
        // Vẽ ảnh gốc
        ctx.drawImage(img, 0, 0);

        // Vẽ Viewer ID chồng lên toàn bộ ảnh
        if (accountId) {
          ctx.globalCompositeOperation = "difference"; // Trộn màu tương phản
          ctx.fillStyle = "rgba(255, 255, 255, 0.03)"; // Chữ màu trắng siêu mờ 3%
          ctx.font = "bold 40px sans-serif";
          
          const textToDraw = `VID:${accountId}`;
          
          // Lặp để in chữ ngang, xếp so le (staggered)
          const stepX = 500;
          const stepY = 150;
          let offset = 0;
          for (let y = 50; y < canvas.height; y += stepY) {
            for (let x = -200 + offset; x < canvas.width; x += stepX) {
              ctx.fillText(textToDraw, x, y);
            }
            // Đổi offset cho hàng tiếp theo để chữ không bị thẳng hàng dọc
            offset = offset === 0 ? 250 : 0;
          }
          ctx.globalCompositeOperation = "source-over"; // Trả lại bình thường
        }

        // --- Bổ sung: Nhúng LSB (Least Significant Bit) siêu bí mật ---
        // Đảm bảo trích xuất tự động 100% thành công nếu người dùng "Lưu hình ảnh thành..."
        if (accountId) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const textToHide = `VID:${accountId}`;
          const textBytes = new TextEncoder().encode(textToHide);
          const bits = [];
          
          // Chuyển string thành mảng các bit (0 và 1)
          for (let i = 0; i < textBytes.length; i++) {
            for (let b = 0; b < 8; b++) {
              bits.push((textBytes[i] >> b) & 1);
            }
          }
          
          // Thay thế bit cuối cùng (Least Significant Bit) của kênh màu Đỏ (Red)
          for (let i = 0; i < bits.length; i++) {
            if (i * 4 < imageData.data.length) {
               imageData.data[i * 4] = (imageData.data[i * 4] & ~1) | bits[i];
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }

        // Chuyển Canvas thành Blob để làm src cho <img>
        canvas.toBlob((blob) => {
          if (blob && isMounted) {
            url = URL.createObjectURL(blob);
            setObjectUrl(url);
            setIsLoading(false);
          }
        }, "image/png");

      } catch (err: any) {
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
      <div className={`flex items-center justify-center bg-black/50 ${className}`} style={props.style}>
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!srcToUse) {
    return <div className={`bg-red-900/20 ${className}`} style={props.style} />;
  }

  return <img src={srcToUse} className={className} {...props} />;
}
