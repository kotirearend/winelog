"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { addToast } = useToast();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      addToast(t("auth.signed_in_success"), "success");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.login_failed");
      setError(message);
      addToast(message, "error");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-[#3A0F18]">{t("auth.login_title")}</h2>
        <p className="text-[#8B7355] font-light">
          {t("auth.login_subtitle")}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-red-50/80 border border-red-200/50 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Email Input */}
        <Input
          label={t("auth.email_label")}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />

        {/* Password Input */}
        <Input
          label={t("auth.password_label")}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />

        {/* Sign In Button */}
        <Button
          type="submit"
          variant="gold"
          className="w-full mt-2"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {t("auth.sign_in")}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E5E1DB]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white/90 text-[#8B7355] font-light">
            {t("auth.new_to_winelog")}
          </span>
        </div>
      </div>

      {/* Sign Up Link */}
      <p className="text-center">
        <Link
          href="/signup"
          className="text-[#D4A847] font-medium hover:text-[#FBBF24] transition-colors underline"
        >
          {t("auth.create_account")}
        </Link>
      </p>

      {/* Join Tasting Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E5E1DB]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white/90 text-[#8B7355] font-light">
            {t("auth.got_tasting_code")}
          </span>
        </div>
      </div>

      {/* Join Tasting Session */}
      {!showJoinInput ? (
        <button
          onClick={() => setShowJoinInput(true)}
          className="w-full h-11 rounded-xl border-2 border-[#22C55E]/40 bg-[#22C55E]/5 text-[#22C55E] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#22C55E]/10 transition-colors"
        >
          <Users className="w-4 h-4" />
          {t("home.join_tasting")}
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))}
            placeholder={t("home.enter_code")}
            maxLength={6}
            autoFocus
            className="flex-1 h-11 rounded-xl border-2 border-[#22C55E]/40 bg-[#22C55E]/5 px-4 text-center font-mono text-lg tracking-[0.3em] text-[#1A1A1A] placeholder:text-[#8B7355]/40 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && joinCode.length >= 4) {
                router.push(`/join/${joinCode}`);
              }
              if (e.key === "Escape") {
                setShowJoinInput(false);
                setJoinCode("");
              }
            }}
          />
          <button
            onClick={() => {
              if (joinCode.length >= 4) router.push(`/join/${joinCode}`);
            }}
            disabled={joinCode.length < 4}
            className="h-11 px-5 rounded-xl bg-[#22C55E] text-white font-medium text-sm flex items-center gap-1.5 disabled:opacity-40 transition-opacity"
          >
            <ArrowRight className="w-4 h-4" />
            {t("home.join")}
          </button>
        </div>
      )}
    </div>
  );
}
