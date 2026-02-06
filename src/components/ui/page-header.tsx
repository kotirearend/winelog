"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  action?: React.ReactNode;
  variant?: "default" | "wine";
}

export function PageHeader({ title, showBack, action, variant = "default" }: PageHeaderProps) {
  const router = useRouter();

  const isWine = variant === "wine";

  return (
    <header className={cn(
      "sticky top-0 z-40",
      isWine
        ? "wine-gradient text-white"
        : "bg-white/80 backdrop-blur-xl border-b border-[#E5E1DB]/50"
    )}>
      <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className={cn(
                "p-2 -ml-2 rounded-xl transition-colors",
                isWine
                  ? "hover:bg-white/10 text-white"
                  : "hover:bg-[#F5F1EB] text-[#1A1A1A]"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className={cn(
            "text-lg font-bold tracking-tight truncate",
            isWine ? "text-white" : "text-[#1A1A1A]"
          )}>
            {title}
          </h1>
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
