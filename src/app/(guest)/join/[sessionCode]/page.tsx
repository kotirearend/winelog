"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Wine, Users, ArrowRight, AlertCircle } from "lucide-react";
import { guestApi } from "@/lib/guest-api-client";

export default function GuestJoinPage() {
  const router = useRouter();
  const params = useParams();
  const sessionCode = (params.sessionCode as string).toUpperCase();

  const [guestName, setGuestName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  // Check if already joined
  useEffect(() => {
    const existingToken = guestApi.getToken();
    const existingCode = guestApi.getSessionCode();
    if (existingToken && existingCode === sessionCode) {
      router.push(`/taste/${sessionCode}`);
    }
  }, [sessionCode, router]);

  const handleJoin = async () => {
    if (!guestName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      await guestApi.joinSession(sessionCode, guestName.trim());
      router.push(`/taste/${sessionCode}`);
    } catch (err: any) {
      setError(err.message || "Failed to join session");
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#7C2D36]/10 mb-4">
          <Wine className="w-8 h-8 text-[#7C2D36]" />
        </div>
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          Join Tasting Session
        </h2>
        <p className="text-[#8B7355] text-sm">
          You&apos;ve been invited to a wine tasting! Enter your name to join.
        </p>
      </div>

      {/* Session code badge */}
      <div className="flex items-center gap-2 bg-[#7C2D36]/5 border border-[#7C2D36]/20 rounded-full px-4 py-2 mb-6">
        <Users className="w-4 h-4 text-[#7C2D36]" />
        <span className="text-sm font-mono font-medium text-[#7C2D36]">
          {sessionCode}
        </span>
      </div>

      {/* Join form */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-[#E5E1DB] p-6">
        <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
          Your Name
        </label>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="e.g. Alex"
          maxLength={50}
          className="w-full px-4 py-3 rounded-xl border border-[#E5E1DB] bg-[#FDFBF7] text-[#1A1A1A] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#7C2D36]/30 focus:border-[#7C2D36] text-lg"
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          autoFocus
        />

        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={isJoining || !guestName.trim()}
          className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-base transition-all disabled:opacity-50"
          style={{ backgroundColor: "#7C2D36" }}
        >
          {isJoining ? (
            <span>Joining...</span>
          ) : (
            <>
              <span>Join Tasting</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      <p className="text-[#8B7355]/60 text-xs text-center mt-6">
        No account needed — just your name and your palate
      </p>
    </div>
  );
}
