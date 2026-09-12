"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number; // ms
}

const BARS = [
  { h: 10, color: "#F59E0B", delay: 0 },
  { h: 22, color: "#F97316", delay: 100 },
  { h: 14, color: "#22C55E", delay: 200 },
  { h: 18, color: "#06B6D4", delay: 300 },
  { h: 8,  color: "#8B5CF6", delay: 150 },
  { h: 26, color: "#EC4899", delay: 250 },
  { h: 16, color: "#38BDF8", delay: 50  },
  { h: 20, color: "#A78BFA", delay: 350 },
];

const STEPS = [
  "Menghubungkan ke server...",
  "Memuat data workspace...",
  "Menyiapkan dashboard...",
  "Siap!",
];

export function SplashScreen({ onComplete, duration = 2400 }: SplashScreenProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const stepInterval = Math.floor(duration / STEPS.length);

    // Advance text steps
    const stepTimers = STEPS.map((_, i) =>
      setTimeout(() => setStep(i), i * stepInterval)
    );

    // Smooth progress bar
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        const next = p + (100 / (duration / 30));
        return next >= 100 ? 100 : next;
      });
    }, 30);

    // Start fade-out 300ms before end
    const fadeTimer = setTimeout(() => setFadeOut(true), duration - 300);

    // Complete
    const doneTimer = setTimeout(() => onComplete(), duration);

    return () => {
      stepTimers.forEach(clearTimeout);
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#030712] flex flex-col items-center justify-center transition-opacity duration-300"
      style={{ opacity: fadeOut ? 0 : 1 }}
      aria-live="polite"
      aria-label="Memuat aplikasi"
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-cyan-500/10 blur-[80px]" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 rounded-full border border-violet-500/30 scale-[1.3] animate-ping" style={{ animationDuration: "2s" }} />
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-violet-600/20 blur-xl scale-150" />
          <div className="relative w-24 h-24 rounded-full bg-[#111C3B] border-2 border-violet-500/50 p-2 shadow-2xl">
            <Image
              src="/logo/BC_DONE.png"
              alt="Broadcast Spensa"
              width={88}
              height={88}
              className="rounded-full object-cover"
              priority
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="font-['Cinzel',serif] font-bold text-2xl tracking-[0.3em] text-white uppercase">
            Broadcast Spensa
          </h1>
          <p className="text-xs font-mono tracking-[0.3em] text-slate-500 uppercase">
            Operating System · v3.0.0
          </p>
        </div>

        {/* Spectrum bars animation */}
        <div className="flex items-end gap-1 h-10" aria-hidden="true">
          {BARS.map((bar, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full"
              style={{
                height: `${bar.h}px`,
                backgroundColor: bar.color,
                animation: `barPulse 0.8s ease-in-out ${bar.delay}ms infinite alternate`,
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-64 space-y-2.5">
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100 ease-linear"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #8B5CF6, #06B6D4)",
              }}
            />
          </div>

          {/* Step label */}
          <p className="text-center text-[11px] font-mono text-slate-400 tracking-wider transition-all duration-300">
            {STEPS[step]}
          </p>
        </div>
      </div>

      {/* Bar pulse keyframe injected via style tag */}
      <style>{`
        @keyframes barPulse {
          from { transform: scaleY(0.4); opacity: 0.5; }
          to   { transform: scaleY(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
