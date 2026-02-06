"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wine, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  {
    icon: <Home className="w-6 h-6" />,
    label: "Home",
    href: "/",
  },
  {
    icon: <Wine className="w-6 h-6" />,
    label: "Cellar",
    href: "/bottles",
  },
  {
    icon: <ClipboardList className="w-6 h-6" />,
    label: "Tastings",
    href: "/tastings",
  },
  {
    icon: <Settings className="w-6 h-6" />,
    label: "Settings",
    href: "/settings",
  },
];

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[#E5E1DB] bg-white md:hidden z-40">
      <div className="flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-3 text-xs font-medium transition-colors",
                isActive
                  ? "text-[#7C2D36]"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { BottomNav };
