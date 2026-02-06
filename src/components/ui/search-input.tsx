"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onChangeDebounced?: (value: string) => void;
  debounceMs?: number;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { className, onChangeDebounced, debounceMs = 300, onChange, ...props },
    ref
  ) => {
    const [value, setValue] = React.useState<string>("");
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onChange?.(e);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onChangeDebounced?.(newValue);
      }, debounceMs);
    };

    const handleClear = () => {
      setValue("");
      if (ref && typeof ref !== "function") {
        ref.current!.value = "";
      }
      onChangeDebounced?.("");
    };

    return (
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />

        <input
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-[#E5E1DB] bg-white pl-10 pr-10 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0",
            className
          )}
          ref={ref}
          value={value}
          onChange={handleChange}
          {...props}
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
