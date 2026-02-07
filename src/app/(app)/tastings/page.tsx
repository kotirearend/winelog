"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wine, Beer, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n-context";
import { api } from "@/lib/api-client";

interface TastingEntry {
  id: string;
  score?: number;
}

interface TastingSession {
  id: string;
  name: string;
  tastedAt: string;
  venue?: string;
  participants?: string;
  notes?: string;
  entries?: TastingEntry[];
}

function formatDate(dateString: string, language: string): string {
  const date = new Date(dateString);
  const localeMap: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    es: "es-ES",
    de: "de-DE",
    it: "it-IT",
  };
  const locale = localeMap[language] || "en-US";
  const month = date.toLocaleString(locale, { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "bg-gold-500 text-white";
  if (score >= 80) return "bg-wine-800 text-white";
  return "bg-wine-100 text-wine-900";
}

function getTopScore(entries: TastingEntry[]): number | null {
  const scores = entries.filter((e) => e.score !== undefined).map((e) => e.score!);
  return scores.length > 0 ? Math.max(...scores) : null;
}

export default function TastingsPage() {
  const router = useRouter();
  const { beverageType } = useAuth();
  const { t, language } = useTranslation();
  const isBeer = beverageType === "beer";
  const [tastings, setTastings] = useState<TastingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTastings = async () => {
      try {
        setIsLoading(true);
        const data = await api.get("/tastings");
        const tastingList = Array.isArray(data) ? data : data.data || [];

        // Sort by date, newest first
        tastingList.sort(
          (a: TastingSession, b: TastingSession) =>
            new Date(b.tastedAt).getTime() - new Date(a.tastedAt).getTime()
        );

        setTastings(tastingList);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch tastings:", err);
        setError("Failed to load tastings. Please try again.");
        setTastings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTastings();
  }, []);

  const handleNewTasting = () => {
    router.push("/tastings/new");
  };

  const handleTastingClick = (tastingId: string) => {
    router.push(`/tastings/${tastingId}`);
  };

  if (isLoading) {
    return <Loading variant="page" />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader
        title={t("tastings.title")}
        variant="wine"
        action={
          <Button
            variant="gold"
            onClick={handleNewTasting}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t("tastings.new")}</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 mb-6 border border-red-200">
            {error}
          </div>
        )}

        {tastings.length === 0 ? (
          <EmptyState
            icon={isBeer ? <Beer className="w-12 h-12 text-amber-700" /> : <Wine className="w-12 h-12 text-wine-800" />}
            title={t("tastings.empty")}
            description={t(`tastings.empty_desc_${beverageType}`)}
            action={{
              label: t("tastings.start"),
              onClick: handleNewTasting,
            }}
          />
        ) : (
          <div className="space-y-4">
            {tastings.map((tasting) => {
              const entries = tasting.entries || [];
              const topScore = getTopScore(entries);
              return (
                <Card
                  key={tasting.id}
                  variant="elevated"
                  className="card-hover cursor-pointer p-5 sm:p-6 rounded-2xl overflow-hidden"
                  onClick={() => handleTastingClick(tasting.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-wine-950 truncate">
                        {tasting.name}
                      </h3>

                      <p className="text-sm text-wine-700 mt-1.5 font-medium">
                        {formatDate(tasting.tastedAt, language)}
                      </p>

                      {tasting.venue && (
                        <p className="text-sm text-wine-600 truncate mt-1">
                          {tasting.venue}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-wine-100 text-wine-800 border-0">
                          {isBeer
                            ? entries.length === 1
                              ? t("tastings.beers", { count: entries.length })
                              : t("tastings.beers_plural", { count: entries.length })
                            : entries.length === 1
                            ? t("tastings.wines", { count: entries.length })
                            : t("tastings.wines_plural", { count: entries.length })}
                        </Badge>

                        {topScore !== null && (
                          <Badge variant="score" className="bg-gradient-to-r from-gold-400 to-gold-600 text-wine-950 border-0 font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Top: {topScore}/100
                          </Badge>
                        )}
                      </div>
                    </div>

                    {topScore !== null && (
                      <div className="flex-shrink-0 text-right">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-lg font-bold ${getScoreColor(topScore)} shadow-lg`}>
                          {topScore}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
