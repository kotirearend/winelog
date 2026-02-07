"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/lib/i18n-context";

const CURRENCIES = [
  { code: "GBP", label: "British Pound (£)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "NZD", label: "New Zealand Dollar (NZ$)" },
  { code: "ZAR", label: "South African Rand (R)" },
  { code: "CHF", label: "Swiss Franc (CHF)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
];

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  const { addToast } = useToast();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("GBP");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signup(email, password, name, defaultCurrency);
      addToast(t("auth.signup_success"), "success");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.signup_failed");
      setError(message);
      addToast(message, "error");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-[#3A0F18]">{t("auth.signup_title")}</h2>
        <p className="text-[#8B7355] font-light">
          {t("auth.signup_subtitle")}
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

        {/* Full Name Input */}
        <Input
          label={t("auth.full_name_label")}
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />

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

        {/* Currency Select */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-[#3A0F18]">
            {t("auth.default_currency")}
          </label>
          <select
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            disabled={isLoading}
            className="flex h-11 w-full rounded-lg border border-[#D5CFCA] bg-white/80 px-4 py-2.5 text-sm text-[#3A0F18] placeholder:text-[#8B7355] transition-all focus:outline-none focus:border-[#D4A847] focus:ring-2 focus:ring-[#D4A847]/20 focus:bg-white disabled:cursor-not-allowed disabled:bg-[#F5F1EB] disabled:text-[#8B7355]"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        {/* Create Account Button */}
        <Button
          type="submit"
          variant="gold"
          className="w-full mt-2"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {t("auth.create_account_btn")}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E5E1DB]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white/90 text-[#8B7355] font-light">
            {t("auth.already_member")}
          </span>
        </div>
      </div>

      {/* Sign In Link */}
      <p className="text-center">
        <Link
          href="/login"
          className="text-[#D4A847] font-medium hover:text-[#FBBF24] transition-colors underline"
        >
          {t("auth.sign_in_link")}
        </Link>
      </p>
    </div>
  );
}
