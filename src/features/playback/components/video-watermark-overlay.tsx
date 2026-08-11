import React from "react";

type Props = {
  viewerId?: string;
};

/**
 * Hiển thị Pattern mờ mờ toàn màn hình chứa ID người xem.
 * Gần như tàng hình (chỉ 3% opacity), nhưng sẽ hiện rõ khi tăng độ tương phản (Contrast) của ảnh chụp rò rỉ.
 */
export const VideoWatermarkOverlay: React.FC<Props> = ({ viewerId }) => {
  if (!viewerId) return null;

  const encodedId = encodeURIComponent(viewerId);
  // Dùng inline SVG làm background pattern rất nhẹ và chống phần mềm chặn quảng cáo
  const svgPattern = `
    <svg width="250" height="150" xmlns="http://www.w3.org/2000/svg">
      <text x="20" y="80" font-family="monospace" font-size="16" font-weight="bold" fill="white" opacity="1" transform="rotate(-25 20 80)">
        ${encodedId}
      </text>
    </svg>
  `;
  const dataUrl = `data:image/svg+xml;utf8,${svgPattern}`;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-40 mix-blend-overlay"
      style={{
        backgroundImage: `url('${dataUrl}')`,
        backgroundRepeat: "repeat",
        // Opacity 0.03 là mức cực kỳ khó thấy bằng mắt thường, không gây khó chịu
        opacity: 0.03, 
      }}
    />
  );
};
