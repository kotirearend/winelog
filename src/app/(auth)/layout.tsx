import React from "react";
import { WinelogLogo } from "@/components/ui/winelog-logo";

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
          <WinelogLogo size="xl" variant="full" color="cream" />

          {/* Subtle quote */}
          <div className="mt-16 border-t border-white/20 pt-8">
            <p className="text-white/60 text-sm italic font-light">
              &ldquo;Wine is the most civilized thing in the world.&rdquo;
            </p>
            <p className="text-white/40 text-xs mt-2">&mdash; Ernest Hemingway</p>
          </div>
        </div>
      </div>

      {/* Form side - full width on mobile, half on sm+ */}
      <div className="w-full sm:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile branding - visible only on mobile */}
          <div className="sm:hidden text-center mb-8">
            <WinelogLogo size="lg" variant="full" color="wine" />
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
