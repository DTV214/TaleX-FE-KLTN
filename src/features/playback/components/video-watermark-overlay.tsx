import React, { useState, useEffect } from "react";

type Props = {
  viewerId?: string;
  currentTime?: number;
};

/**
 * Hiển thị Watermark chống quay lén trên Video.
 * Yêu cầu:
 * - Nằm ngang (không xoay).
 * - Tên website (talex.pro.vn) nằm ở vùng trên (Top 5% - 15%).
 * - UserID (VID:xxx) nằm ở vùng dưới (Top 80% - 90%).
 * - Tránh hoàn toàn vùng giữa (nơi tập trung tầm nhìn của user).
 * - Nhỏ gọn, mờ 4%, chớp tắt mỗi 20s.
 */
export const VideoWatermarkOverlay: React.FC<Props> = ({ viewerId, currentTime = 0 }) => {
  const [brandPos, setBrandPos] = useState({ top: "10%", left: "10%" });
  const [userPos, setUserPos] = useState({ top: "85%", left: "80%" });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!viewerId) return;

    // Bỏ qua 3 giây đầu tiên
    if (currentTime < 3) {
      if (isVisible) setIsVisible(false);
      return;
    }

    // Tính toán chu kỳ 20 giây (tính từ giây thứ 3)
    const cycleTime = (currentTime - 3) % 20;
    
    // Nếu nằm trong khoảng 3 giây đầu của chu kỳ thì hiện
    const shouldBeVisible = cycleTime >= 0 && cycleTime <= 3;

    if (shouldBeVisible && !isVisible) {
      // talex.pro.vn: Vùng trên (5% - 15% chiều cao)
      setBrandPos({
        top: `${5 + Math.random() * 10}%`,
        left: `${10 + Math.random() * 60}%`, // Tránh tràn biên phải
      });
      
      // VID:xxx : Vùng dưới (80% - 90% chiều cao)
      setUserPos({
        top: `${80 + Math.random() * 10}%`,
        left: `${10 + Math.random() * 70}%`, // Tránh tràn biên phải
      });
      
      setIsVisible(true);
    } else if (!shouldBeVisible && isVisible) {
      setIsVisible(false);
    }
  }, [currentTime, viewerId, isVisible]);

  if (!viewerId || !isVisible) return null;

  return (
    <>
      {/* Tên miền website (Vùng trên) */}
      <div
        className="pointer-events-none absolute z-40 mix-blend-difference"
        style={{
          top: brandPos.top,
          left: brandPos.left,
          opacity: 0.04,
        }}
      >
        <div className="text-base font-black text-white drop-shadow-md tracking-wider">talex.pro.vn</div>
      </div>
      
      {/* User ID (Vùng dưới) */}
      <div
        className="pointer-events-none absolute z-40 mix-blend-difference"
        style={{
          top: userPos.top,
          left: userPos.left,
          opacity: 0.04,
        }}
      >
        <div className="text-sm font-bold text-white drop-shadow-md">{viewerId}</div>
      </div>
    </>
  );
};
