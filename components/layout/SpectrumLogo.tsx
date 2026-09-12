import React from "react";
import Image from "next/image";

interface SpectrumLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function SpectrumLogo({ size = "md", showText = true }: SpectrumLogoProps) {
  const sizeMap = {
    sm: { img: 32, fontTitle: "text-sm", fontSub: "text-[9px]" },
    md: { img: 42, fontTitle: "text-base", fontSub: "text-[10px]" },
    lg: { img: 56, fontTitle: "text-xl", fontSub: "text-xs" },
  };

  const current = sizeMap[size];

  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative flex-shrink-0">
        <div className="relative rounded-full p-1 bg-surface-2 border border-orbital-violet/40 glow-orbital">
          <Image
            src="/logo/BC_DONE.png"
            alt="Broadcast Spensa Official Logo"
            width={current.img}
            height={current.img}
            className="rounded-full object-cover"
            priority
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-brand font-bold tracking-[0.2em] text-white leading-tight">
              BROADCAST
            </span>
            {/* Frequency spectrum bars indicator */}
            <span className="flex items-end gap-0.5 h-3.5 pb-0.5">
              <span className="w-0.5 h-1.5 bg-spectrum-gold rounded-full animate-pulse"></span>
              <span className="w-0.5 h-3 bg-spectrum-amber rounded-full animate-pulse delay-75"></span>
              <span className="w-0.5 h-2 bg-spectrum-jade rounded-full animate-pulse delay-150"></span>
              <span className="w-0.5 h-2.5 bg-spectrum-cyan rounded-full animate-pulse delay-100"></span>
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-studio-text-secondary uppercase">
            SPENSA OS · v3.0.0
          </span>
        </div>
      )}
    </div>
  );
}
