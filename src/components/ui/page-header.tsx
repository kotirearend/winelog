"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  action?: React.ReactNode;
  className?: string;
}

function PageHeader({
  title,
  showBack = false,
  action,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-[#E5E1DB] bg-white px-4 py-4 sm:px-6",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex-shrink-0 p-2 text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F5F1EB] rounded-md transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-[#1A1A1A] truncate">{title}</h1>
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export { PageHeader };
