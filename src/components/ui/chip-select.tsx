"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ChipOption = string | { value: string; label: string };

export function ChipSelect({
  options,
  value,
  onChange,
  accentColor,
}: {
  options: ChipOption[];
  value?: string;
  onChange: (v: string) => void;
  accentColor?: string;
}) {
  const activeColor = accentColor || "#7C2D36";
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const optValue = typeof option === "string" ? option : option.value;
        const optLabel = typeof option === "string" ? option : option.label;
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => onChange(optValue)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              value === optValue
                ? "text-white"
                : "border border-[#E5E1DB] text-[#1A1A1A] bg-white hover:border-[#7C2D36]"
            )}
            style={value === optValue ? { backgroundColor: activeColor } : undefined}
          >
            {optLabel}
          </button>
        );
      })}
    </div>
  );
}
