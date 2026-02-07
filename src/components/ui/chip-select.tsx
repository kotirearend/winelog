"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function ChipSelect({
  options,
  value,
  onChange,
  accentColor,
}: {
  options: string[];
  value?: string;
  onChange: (v: string) => void;
  accentColor?: string;
}) {
  const activeColor = accentColor || "#7C2D36";
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            value === option
              ? "text-white"
              : "border border-[#E5E1DB] text-[#1A1A1A] bg-white hover:border-[#7C2D36]"
          )}
          style={value === option ? { backgroundColor: activeColor } : undefined}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
