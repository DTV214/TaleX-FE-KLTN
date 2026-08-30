"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Crop } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  aspectRatio: number; // e.g. 2/3 for poster, 16/9 for banner
  aspectRatioLabel: string; // e.g. "2:3 (Dọc)" or "16:9 (Ngang)"
  title: string;
  originalFileName?: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  aspectRatio,
  aspectRatioLabel,
  title,
  originalFileName = "cropped-image.jpg",
  onClose,
  onCropComplete,
}: ImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({
    x: 0,
    y: 0,
    posX: 0,
    posY: 0,
  });

  // Calculate container crop box size
  const maxBoxWidth = 520;
  const maxBoxHeight = 420;

  let cropBoxWidth = maxBoxWidth;
  let cropBoxHeight = cropBoxWidth / aspectRatio;

  if (cropBoxHeight > maxBoxHeight) {
    cropBoxHeight = maxBoxHeight;
    cropBoxWidth = cropBoxHeight * aspectRatio;
  }

  // Handle image load to initialize scale and centering
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Calculate base scale to ensure image covers crop box (cover fit)
  const baseScale = naturalSize
    ? Math.max(cropBoxWidth / naturalSize.width, cropBoxHeight / naturalSize.height)
    : 1;

  const currentScale = baseScale * zoom;
  const renderedWidth = naturalSize ? naturalSize.width * currentScale : cropBoxWidth;
  const renderedHeight = naturalSize ? naturalSize.height * currentScale : cropBoxHeight;

  // Clamping position so image always covers the crop box
  const maxOffsetX = (renderedWidth - cropBoxWidth) / 2;
  const maxOffsetY = (renderedHeight - cropBoxHeight) / 2;

  const clampPosition = useCallback(
    (x: number, y: number) => {
      const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, x));
      const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, y));
      return { x: clampedX, y: clampedY };
    },
    [maxOffsetX, maxOffsetY]
  );

  // Mouse / Touch handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const newPos = clampPosition(
        dragStartRef.current.posX + deltaX,
        dragStartRef.current.posY + deltaY
      );
      setPosition(newPos);
    },
    [isDragging, clampPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      const newPos = clampPosition(
        dragStartRef.current.posX + deltaX,
        dragStartRef.current.posY + deltaY
      );
      setPosition(newPos);
    },
    [isDragging, clampPosition]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Adjust position when zoom changes
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3, newZoom));
    setZoom(clampedZoom);
  };

  // Perform canvas cropping
  const handleConfirmCrop = () => {
    if (!naturalSize || !imageRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement("canvas");

    // Output target dimensions
    const outputWidth = aspectRatio >= 1 ? 1600 : 1000;
    const outputHeight = Math.round(outputWidth / aspectRatio);

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Image offset relative to crop box center
    // Center of crop box = (cropBoxWidth / 2, cropBoxHeight / 2)
    // Center of rendered image = (cropBoxWidth / 2 + position.x, cropBoxHeight / 2 + position.y)
    // Image top-left in crop box coords = (cropBoxWidth - renderedWidth) / 2 + position.x
    const imageLeftInCropBox = (cropBoxWidth - renderedWidth) / 2 + position.x;
    const imageTopInCropBox = (cropBoxHeight - renderedHeight) / 2 + position.y;

    // Crop box in image visual coordinates
    const cropXVis = -imageLeftInCropBox;
    const cropYVis = -imageTopInCropBox;

    // Scale from visual coordinates to natural image pixels
    const visToNatural = naturalSize.width / renderedWidth;

    const sx = Math.max(0, cropXVis * visToNatural);
    const sy = Math.max(0, cropYVis * visToNatural);
    const sw = Math.min(naturalSize.width - sx, cropBoxWidth * visToNatural);
    const sh = Math.min(naturalSize.height - sy, cropBoxHeight * visToNatural);

    // Draw high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const fileExt = originalFileName.includes(".")
          ? originalFileName.split(".").pop()
          : "jpg";
        const cleanName = originalFileName.replace(/\.[^/.]+$/, "");
        const fileName = `${cleanName}-cropped.${fileExt === "png" ? "png" : "jpg"}`;
        const mimeType = fileExt === "png" ? "image/png" : "image/jpeg";

        const croppedFile = new File([blob], fileName, { type: mimeType });
        const previewUrl = URL.createObjectURL(croppedFile);

        onCropComplete(croppedFile, previewUrl);
        onClose();
      },
      originalFileName.endsWith(".png") ? "image/png" : "image/jpeg",
      0.95
    );
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#141417] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-creator-gold/10 text-creator-gold border border-creator-gold/20">
                <Crop size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{title}</h3>
                <span className="text-xs text-creator-muted">
                  Tỷ lệ khung hình khuyến nghị: <strong className="text-creator-gold">{aspectRatioLabel}</strong>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Crop Workspace */}
          <div className="relative flex flex-col items-center justify-center bg-[#0a0a0c] p-6 select-none overflow-hidden">
            {/* Guide message */}
            <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-400">
              <Move size={13} className="text-creator-gold" />
              <span>Kéo ảnh để căn chỉnh vị trí mong muốn</span>
            </div>

            {/* Crop Window Container */}
            <div
              ref={containerRef}
              style={{ width: cropBoxWidth, height: cropBoxHeight }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="relative overflow-hidden rounded-xl border-2 border-creator-gold shadow-[0_0_30px_rgba(226,177,60,0.2)] cursor-grab active:cursor-grabbing bg-black/60"
            >
              {/* Image */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                draggable={false}
                style={{
                  width: renderedWidth,
                  height: renderedHeight,
                  transform: `translate(${(cropBoxWidth - renderedWidth) / 2 + position.x}px, ${
                    (cropBoxHeight - renderedHeight) / 2 + position.y
                  }px)`,
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                className="absolute left-0 top-0 max-w-none pointer-events-none"
              />

              {/* Rule of Thirds Grid Overlay */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            </div>

            {/* Zoom Slider Control */}
            <div className="mt-5 flex items-center gap-4 w-full max-w-md bg-[#18181c] border border-white/10 px-4 py-2.5 rounded-xl">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.15)}
                disabled={zoom <= 1}
                className="text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:text-gray-400 cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut size={16} />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 accent-creator-gold cursor-pointer"
              />

              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.15)}
                disabled={zoom >= 3}
                className="text-gray-400 hover:text-white disabled:opacity-40 disabled:hover:text-gray-400 cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn size={16} />
              </button>

              <span className="text-xs font-bold text-gray-300 min-w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={handleReset}
                className="ml-1 text-gray-400 hover:text-creator-gold transition-colors cursor-pointer"
                title="Đặt lại góc nhìn ban đầu"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-[#141417]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirmCrop}
              className="flex items-center gap-2 px-5 py-2 text-xs font-black text-black bg-creator-gold hover:bg-creator-gold-hover rounded-xl shadow-lg shadow-creator-gold/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <Check size={16} />
              <span>Cắt & Áp dụng</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
