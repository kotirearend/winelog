import React from "react";
import { WinelogLogo } from "@/components/ui/winelog-logo";
import { I18nProvider } from "@/lib/i18n-context";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-[#FDFBF7]">
        {/* Minimal guest header */}
        <div className="bg-gradient-to-r from-[#7C2D36] to-[#5C1D28] px-4 py-3 flex items-center justify-center gap-2">
          <WinelogLogo size="sm" variant="icon" color="cream" />
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              WineLog
            </h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 py-6">{children}</div>
      </div>
    </I18nProvider>
  );
}
