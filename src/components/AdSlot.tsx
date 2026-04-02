"use client";

import { useEffect, useRef, useState } from "react";

interface AdSlotProps {
  slot: "leaderboard" | "sidebar" | "inline";
  className?: string;
}

// Ad dimensions by slot type
const AD_SIZES = {
  leaderboard: { width: 728, height: 90, mobileWidth: 320, mobileHeight: 50 },
  sidebar: { width: 300, height: 250 },
  inline: { width: 336, height: 280 },
} as const;

export function AdSlot({ slot, className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // In production, this would initialize Google AdSense
  // For now, render a placeholder that collapses gracefully
  useEffect(() => {
    // Simulate ad load check
    // In production: adsbygoogle.push({}) + check if ad filled
    const timer = setTimeout(() => {
      // Placeholder: always "loaded" in dev, in production this checks actual ad fill
      setLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const sizes = AD_SIZES[slot];
  const width = isMobile && "mobileWidth" in sizes ? sizes.mobileWidth : sizes.width;
  const height = isMobile && "mobileHeight" in sizes ? sizes.mobileHeight : sizes.height;

  // Collapse if ad didn't load
  if (!loaded) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center overflow-hidden rounded-lg border border-border/30 bg-muted/30 ${className}`}
      style={{ maxWidth: width, maxHeight: height, width: "100%" }}
      data-ad-slot={slot}
    >
      {/* Placeholder for development — replace with actual AdSense unit in production */}
      <div
        className="flex items-center justify-center text-xs text-muted-foreground/50"
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="mb-1 text-lg">📢</div>
          <div>إعلان</div>
          <div className="text-[10px] opacity-60">Ad Slot — {slot}</div>
        </div>
      </div>
    </div>
  );
}
