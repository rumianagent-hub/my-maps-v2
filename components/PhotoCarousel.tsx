"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  photos: string[];
  alt?: string;
  aspectRatio?: string;
  className?: string;
  overlay?: React.ReactNode;
}

export default function PhotoCarousel({ photos, alt = "", aspectRatio = "aspect-[4/3]", className = "", overlay }: Props) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const mouseStart = useRef<{ x: number; time: number } | null>(null);

  const goTo = useCallback((i: number) => setCurrent(Math.max(0, Math.min(photos.length - 1, i))), [photos.length]);

  const finishDrag = (startTime: number) => {
    const velocity = Math.abs(dragOffset) / (Date.now() - startTime);
    const threshold = velocity > 0.3 ? 30 : 80;
    if (dragOffset < -threshold && current < photos.length - 1) goTo(current + 1);
    else if (dragOffset > threshold && current > 0) goTo(current - 1);
    setDragOffset(0);
    setIsDragging(false);
  };

  if (photos.length === 0) return null;

  return (
    <div
      className={`relative overflow-hidden select-none ${aspectRatio} ${className}`}
      onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() }; setIsDragging(true); }}
      onTouchMove={(e) => {
        if (!touchStart.current) return;
        const dx = e.touches[0].clientX - touchStart.current.x;
        if (Math.abs(dx) > Math.abs(e.touches[0].clientY - touchStart.current.y)) { e.preventDefault(); setDragOffset(dx); }
      }}
      onTouchEnd={() => { if (touchStart.current) { finishDrag(touchStart.current.time); touchStart.current = null; } }}
      onMouseDown={(e) => { if (photos.length <= 1) return; mouseStart.current = { x: e.clientX, time: Date.now() }; setIsDragging(true); e.preventDefault(); }}
      onMouseMove={(e) => { if (mouseStart.current && isDragging) setDragOffset(e.clientX - mouseStart.current.x); }}
      onMouseUp={() => { if (mouseStart.current) { finishDrag(mouseStart.current.time); mouseStart.current = null; } }}
      onMouseLeave={() => { if (mouseStart.current) { mouseStart.current = null; setDragOffset(0); setIsDragging(false); } }}
      style={{ cursor: photos.length > 1 ? "grab" : undefined }}
    >
      <div
        className={`flex h-full ${isDragging ? "" : "transition-transform duration-300 ease-out"}`}
        style={{ transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))` }}
      >
        {photos.map((url, i) => (
          <div key={i} className="w-full h-full flex-shrink-0">
            <img src={url} alt={alt} className="w-full h-full object-cover pointer-events-none" draggable={false} loading="lazy" />
          </div>
        ))}
      </div>
      {overlay}
      {photos.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-white w-5" : "bg-white/40 w-2"}`} />
            ))}
          </div>
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-white/80 border border-white/10">
            {current + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
}
