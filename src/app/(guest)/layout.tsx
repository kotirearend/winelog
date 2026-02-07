import React from "react";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Minimal guest header */}
      <div className="bg-gradient-to-r from-[#7C2D36] to-[#5C1D28] px-4 py-3 text-center">
        <h1 className="text-white font-semibold text-lg tracking-tight">
          Winelog
        </h1>
        <p className="text-white/60 text-xs">Social Tasting</p>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
