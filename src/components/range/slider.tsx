"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CustomSliderProps } from "./types";

export const Slider: React.FC<CustomSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = "",
  icon,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const minIconOpacity = 50;
  const opacityStep = useMemo(() => {
    return minIconOpacity / (max - min);
  }, [max, min]);
  const [isDragging, setIsDragging] = useState(false);
  const [percent, setPercent] = useState(getPercent());
  let lastX = 0;
  let lastY = 0;

  function getPercent() {
    if (!thumbRef.current || !trackRef.current) return 50;

    const thumbWidth = thumbRef.current.offsetWidth || 0;
    const halfThumbPercent =
      ((thumbWidth / trackRef.current.offsetWidth) * 100) / 2;

    const minPercent = halfThumbPercent;
    const maxPercent = 100 - halfThumbPercent;

    const safeRange = max - min;
    const rawPercent = ((value - min) / safeRange) * 100;

    const adjustedPercent =
      minPercent + (rawPercent / 100) * (maxPercent - minPercent);

    return Math.min(Math.max(adjustedPercent, minPercent), maxPercent);
  }

  useEffect(() => {
    setPercent(getPercent());
  }, [thumbRef, value]);

  const handlePosition = (clientX: number) => {
    if (!trackRef.current || !thumbRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = thumbRef.current.offsetWidth;
    const halfThumbPercent = (thumbWidth / trackRect.width) * 50;

    const minPercent = halfThumbPercent;
    const maxPercent = 100 - halfThumbPercent;

    const relativeX = clientX - trackRect.left;
    let rawPercent = (relativeX / trackRect.width) * 100;

    rawPercent = Math.max(minPercent, Math.min(maxPercent, rawPercent));

    const usablePercent = (rawPercent - minPercent) / (maxPercent - minPercent);

    const rawValue = min + usablePercent * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;

    onChange(steppedValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handlePosition(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      handlePosition(clientX);

      e.preventDefault();
    };
    const stopDrag = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("mouseup", stopDrag);
      window.addEventListener("touchend", stopDrag);
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [isDragging]);

  return (
    <div
      ref={trackRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`relative h-8 bg-gray-300 rounded-full cursor-pointer shadow-sm select-none ${className}`}
    >
      {icon && (
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 left-[7px] z-1 pointer-events-none select-none`}
          style={{
            opacity: minIconOpacity + opacityStep * (value - 1) + "%",
          }}
        >
          {icon}
        </div>
      )}

      <div
        className="absolute h-full bg-gray-100 rounded-full transition-all"
        style={{ width: `calc(${percent}% + 10px)` }}
      />

      <div
        ref={thumbRef}
        className={`absolute top-1/2 w-8 h-8 bg-white border border-gray-100 shadow-sm rounded-full -translate-x-1/2 -translate-y-1/2 transition-all select-none`}
        style={{ left: `${percent}%` }}
      />
    </div>
  );
};
