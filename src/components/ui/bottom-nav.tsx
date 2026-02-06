"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Wine, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Wine, label: "Cellar", path: "/bottles" },
  { icon: ClipboardList, label: "Tastings", path: "/tastings" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50">
      <div className="mx-3 mb-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/10">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200",
                  active
                    ? "bg-[#7C2D36] text-white shadow-md shadow-[#7C2D36]/30"
                    : "text-[#6B7280] hover:text-[#7C2D36] active:scale-95"
                )}
              >
                <item.icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                <span className={cn(
                  "text-[10px] font-semibold leading-none",
                  active ? "text-white" : "text-[#6B7280]"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
