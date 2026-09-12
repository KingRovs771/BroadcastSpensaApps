import React from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeVariant =
  | "gold"      // Draft, Soft Warning
  | "amber"     // Pending Approval, Belum Lunas
  | "tangerine" // Deadline H-3, Rejected, Alpha, Tertunggak
  | "mandarin"  // In-Production, Sedang Dipinjam
  | "jade"      // Live On-Air, Approved, Lunas, Selesai
  | "cyan"      // Interaktif, Active Tab, Primary Secondary
  | "cobalt"    // Sakit, Data Link, Export
  | "violet"    // Signature Brand, Elevated
  | "muted";    // Tunda, Nonaktif

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({
  label,
  variant = "cyan",
  className,
  dot = true,
}: StatusBadgeProps) {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string; border: string }> = {
    gold: {
      bg: "bg-spectrum-gold/15",
      text: "text-spectrum-gold",
      dot: "bg-spectrum-gold",
      border: "border-spectrum-gold/30",
    },
    amber: {
      bg: "bg-spectrum-amber/15",
      text: "text-spectrum-amber",
      dot: "bg-spectrum-amber",
      border: "border-spectrum-amber/30",
    },
    tangerine: {
      bg: "bg-spectrum-tangerine/15",
      text: "text-spectrum-tangerine",
      dot: "bg-spectrum-tangerine",
      border: "border-spectrum-tangerine/30",
    },
    mandarin: {
      bg: "bg-spectrum-mandarin/15",
      text: "text-spectrum-mandarin",
      dot: "bg-spectrum-mandarin",
      border: "border-spectrum-mandarin/30",
    },
    jade: {
      bg: "bg-spectrum-jade/15",
      text: "text-spectrum-jade",
      dot: "bg-spectrum-jade",
      border: "border-spectrum-jade/30",
    },
    cyan: {
      bg: "bg-spectrum-cyan/15",
      text: "text-spectrum-cyan",
      dot: "bg-spectrum-cyan",
      border: "border-spectrum-cyan/30",
    },
    cobalt: {
      bg: "bg-spectrum-cobalt/15",
      text: "text-blue-400",
      dot: "bg-spectrum-cobalt",
      border: "border-spectrum-cobalt/30",
    },
    violet: {
      bg: "bg-orbital-violet/15",
      text: "text-orbital-magenta",
      dot: "bg-orbital-magenta",
      border: "border-orbital-violet/40",
    },
    muted: {
      bg: "bg-studio-border-subtle",
      text: "text-studio-text-muted",
      dot: "bg-studio-text-muted",
      border: "border-studio-border-subtle",
    },
  };

  const style = variantStyles[variant] || variantStyles.cyan;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border",
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", style.dot)} />}
      {label}
    </span>
  );
}
