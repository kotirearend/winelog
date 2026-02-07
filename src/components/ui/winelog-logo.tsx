"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WinelogLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "wordmark";
  className?: string;
  color?: "wine" | "white" | "cream";
}

function LogoIcon({ className, color = "wine" }: { className?: string; color?: string }) {
  const fill = color === "white" ? "#FFFFFF" : color === "cream" ? "#FDFBF7" : "#7C2D36";
  const dark = color === "white" ? "#FFFFFF" : color === "cream" ? "#F5F1EB" : "#5C1F28";
  const accent = color === "white" ? "#7C2D36" : color === "cream" ? "#7C2D36" : "#FDFBF7";

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" fill="none" className={className}>
      {/* Wine glass bowl */}
      <path d="M30 10 L30 50 C30 72 45 85 60 85 C75 85 90 72 90 50 L90 10 Z" fill={fill} />
      {/* Wine surface */}
      <path d="M36 38 C36 38 45 44 60 44 C75 44 84 38 84 38 L84 50 C84 69 73 80 60 80 C47 80 36 69 36 50 Z" fill={dark} />
      {/* Leaf/check mark */}
      <path d="M44 35 C44 35 50 48 60 48 C66 48 72 42 76 32" stroke={accent} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M60 48 C60 48 56 56 48 58" stroke={accent} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* Stem */}
      <rect x="56" y="85" width="8" height="30" rx="2" fill={fill} />
      {/* Base */}
      <ellipse cx="60" cy="120" rx="24" ry="6" fill={fill} />
    </svg>
  );
}

export function WinelogLogo({ size = "md", variant = "full", className, color = "wine" }: WinelogLogoProps) {
  const textColor = color === "white" ? "text-white" : color === "cream" ? "text-[#FDFBF7]" : "text-[#7C2D36]";
  const taglineColor = color === "white" ? "text-white/60" : color === "cream" ? "text-[#FDFBF7]/60" : "text-[#8B7355]";

  const iconSizes = {
    sm: "w-8 h-9",
    md: "w-12 h-14",
    lg: "w-16 h-[4.5rem]",
    xl: "w-24 h-28",
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl",
    xl: "text-5xl",
  };

  const taglineSizes = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-xs",
    xl: "text-sm",
  };

  if (variant === "icon") {
    return <LogoIcon className={cn(iconSizes[size], className)} color={color} />;
  }

  if (variant === "wordmark") {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <h1 className={cn("font-bold tracking-tight", textSizes[size], textColor)} style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif" }}>
          WineLog
        </h1>
        <p className={cn("font-semibold tracking-[0.25em] uppercase mt-0.5", taglineSizes[size], taglineColor)}>
          Capture. Taste. Remember.
        </p>
      </div>
    );
  }

  // Full logo
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <LogoIcon className={iconSizes[size]} color={color} />
      <h1 className={cn("font-bold tracking-tight mt-1", textSizes[size], textColor)} style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif" }}>
        WineLog
      </h1>
      <p className={cn("font-semibold tracking-[0.25em] uppercase mt-0.5", taglineSizes[size], taglineColor)}>
        Capture. Taste. Remember.
      </p>
    </div>
  );
}
