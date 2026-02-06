import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Winelog Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#7C2D36] text-white mb-4">
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2C9.5 2 9 2.2 9 3v2h2V3c0-.8-.5-1-1-1zm0 5c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 2c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#7C2D36]">Winelog</h1>
          <p className="text-[#6B7280] text-sm mt-1">Track your wines and tastings</p>
        </div>

        {/* Auth Content */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DB] p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
