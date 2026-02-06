"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";

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
      addToast("Account created successfully", "success");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      addToast(message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-[#1A1A1A]">Create Account</h2>
        <p className="text-sm text-[#6B7280]">
          Join Winelog to start tracking your wine collection
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#1A1A1A]">
            Default Currency
          </label>
          <select
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            disabled={isLoading}
            className="flex h-10 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-[#FDFBF7] disabled:text-[#6B7280]"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-[#6B7280]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#7C2D36] font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
