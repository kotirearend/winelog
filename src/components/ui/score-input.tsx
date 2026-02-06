"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ScoreInputProps {
  value?: number;
  onChange?: (value: number) => void;
  label?: string;
  category?: string;
  className?: string;
}

const ScoreInput = React.forwardRef<HTMLDivElement, ScoreInputProps>(
  ({ value = 0, onChange, label, category, className }, ref) => {
    const [inputValue, setInputValue] = React.useState<string>(
      value?.toString() || "0"
    );

    React.useEffect(() => {
      setInputValue(value?.toString() || "0");
    }, [value]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      setInputValue(newValue.toString());
      onChange?.(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      const numValue = parseInt(newValue, 10);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
        onChange?.(numValue);
      }
    };

    const numValue = Math.min(20, Math.max(0, parseInt(inputValue, 10) || 0));

    return (
      <div ref={ref} className={cn("flex flex-col gap-3", className)}>
        {label && (
          <label className="text-sm font-medium text-[#1A1A1A]">
            {label}
          </label>
        )}

        {category && (
          <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wide">
            {category}
          </p>
        )}

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="20"
              value={numValue}
              onChange={handleSliderChange}
              className={cn(
                "w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-[#E5E1DB] to-[#D4A847]",
                "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#7C2D36] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md",
                "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#7C2D36] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="20"
              value={inputValue}
              onChange={handleInputChange}
              className={cn(
                "w-14 h-10 rounded-md border border-[#E5E1DB] bg-white px-2 py-1 text-center text-sm font-semibold text-[#7C2D36] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0"
              )}
            />
            <span className="text-xs text-[#6B7280] font-medium">/20</span>
          </div>
        </div>
      </div>
    );
  }
);

ScoreInput.displayName = "ScoreInput";

export { ScoreInput };
