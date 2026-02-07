"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Wine, Beer, ClipboardList, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { beverageType } = useAuth();
  const { t } = useTranslation();
  const isBeer = beverageType === "beer";

  const NAV_ITEMS = [
    { icon: Home, label: t("nav.home"), path: "/" },
    { icon: isBeer ? Beer : Wine, label: t(`nav.cellar_${beverageType}`), path: "/bottles" },
    { icon: ClipboardList, label: t("nav.tastings"), path: "/tastings" },
    { icon: Settings, label: t("nav.settings"), path: "/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const accentColor = isBeer ? "#B45309" : "#7C2D36";

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
                    ? "text-white shadow-md"
                    : "text-[#6B7280] active:scale-95"
                )}
                style={active ? { backgroundColor: accentColor, boxShadow: `0 4px 6px -1px ${accentColor}4D` } : undefined}
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
