import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Wine gradient branding side - hidden on mobile, visible on sm+ */}
      <div className="hidden sm:flex sm:w-1/2 wine-gradient flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 -ml-48 -mb-48" />

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Large decorative wine glass icon */}
          <div className="mb-8">
            <svg
              className="w-32 h-32 mx-auto text-white/30 mb-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={0.5}
              viewBox="0 0 24 24"
            >
              <path d="M6 3h12v4c0 2-1 4-3 5v6h2v2H7v-2h2v-6c-2-1-3-3-3-5V3z" />
            </svg>
          </div>

          {/* Branding */}
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Winelog</h1>
          <p className="text-white/80 text-lg font-light mb-8">
            Discover, Track & Celebrate Your Wine Journey
          </p>

          {/* Subtle quote */}
          <div className="mt-16 border-t border-white/20 pt-8">
            <p className="text-white/60 text-sm italic font-light">
              "Wine is the most civilized thing in the world."
            </p>
            <p className="text-white/40 text-xs mt-2">— Ernest Hemingway</p>
          </div>
        </div>
      </div>

      {/* Form side - full width on mobile, half on sm+ */}
      <div className="w-full sm:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile branding - visible only on mobile */}
          <div className="sm:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#7C2D36] to-[#3A0F18] text-white mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path d="M6 3h12v4c0 2-1 4-3 5v6h2v2H7v-2h2v-6c-2-1-3-3-3-5V3z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-[#7C2D36]">Winelog</h1>
            <p className="text-[#8B7355] text-sm mt-2 font-light">
              Discover, track & celebrate wine
            </p>
          </div>

          {/* Glass-like card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/40 p-8">
            {children}
          </div>

          {/* Footer text */}
          <p className="text-center text-[#8B7355] text-xs mt-6 font-light">
            Experience wine like never before
          </p>
        </div>
      </div>
    </div>
  );
}
