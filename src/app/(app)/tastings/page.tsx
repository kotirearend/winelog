"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wine } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "bg-[#D4A847]"; // gold
  if (score >= 80) return "bg-[#059669]"; // green
  return "bg-[#E5E1DB]"; // neutral
}

function getTopScore(entries: TastingEntry[]): number | null {
  const scores = entries.filter((e) => e.score !== undefined).map((e) => e.score!);
  return scores.length > 0 ? Math.max(...scores) : null;
}

export default function TastingsPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader
        title="Tastings"
        action={
          <Button
            size="icon"
            onClick={handleNewTasting}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {tastings.length === 0 ? (
          <EmptyState
            icon={<Wine className="w-12 h-12" />}
            title="No tastings yet"
            description="Start your first tasting session to begin comparing wines."
            action={{
              label: "New Tasting",
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
                  className="cursor-pointer transition-all hover:shadow-md active:shadow-sm p-4 sm:p-6"
                  onClick={() => handleTastingClick(tasting.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-[#1A1A1A] truncate">
                        {tasting.name}
                      </h3>

                      <p className="text-sm text-[#6B7280] mt-1">
                        {formatDate(tasting.tastedAt)}
                      </p>

                      {tasting.venue && (
                        <p className="text-sm text-[#6B7280] truncate">
                          {tasting.venue}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {entries.length} wine{entries.length !== 1 ? "s" : ""}
                        </Badge>

                        {topScore !== null && (
                          <Badge variant="score">
                            Top: {topScore}/100
                          </Badge>
                        )}
                      </div>
                    </div>

                    {topScore !== null && (
                      <div className="flex-shrink-0 text-right">
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white ${getScoreColor(topScore)}`}>
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
