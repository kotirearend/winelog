"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Wine,
  Trophy,
  Star,
  Users,
  Loader2,
  ArrowLeft,
  Crown,
  ThumbsDown,
} from "lucide-react";
import { guestApi } from "@/lib/guest-api-client";
import { useTranslation } from "@/lib/i18n-context";

interface HostEntry {
  id: string;
  adHocName: string | null;
  bottleName: string | null;
  bottleProducer: string | null;
  bottleVintage: number | null;
  bottlePhotoUrl: string | null;
  adHocPhotoUrl: string | null;
  entryPhotoUrl: string | null;
}

interface GuestEntryScore {
  id: string;
  guestId: string | null;
  guestName: string | null;
  parentEntryId: string | null;
  totalScore: number | null;
  tastingNotes: Record<string, any> | null;
  notesShort: string | null;
}

interface GuestInfo {
  id: string;
  guestName: string;
  joinedAt: string;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#22C55E";
  if (score >= 75) return "#D4A847";
  if (score >= 60) return "#F59E0B";
  if (score >= 40) return "#EF4444";
  return "#9CA3AF";
}

// Score label keys mapped to score ranges
function getScoreLabelKey(score: number): string {
  if (score >= 90) return "quality.elite";
  if (score >= 75) return "quality.proper_good";
  if (score >= 60) return "quality.solid";
  if (score >= 40) return "quality.alright";
  return "quality.nah";
}

export default function GuestResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionCode = (params.sessionCode as string).toUpperCase();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [hostEntries, setHostEntries] = useState<HostEntry[]>([]);
  const [allEntries, setAllEntries] = useState<GuestEntryScore[]>([]);
  const [guests, setGuests] = useState<GuestInfo[]>([]);
  const [myGuestId, setMyGuestId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadResults = useCallback(async () => {
    try {
      const data = await guestApi.get(`/guest-sessions/${sessionCode}`);
      setSessionName(data.session.name);
      setHostEntries(data.hostEntries);
      setAllEntries(data.allEntries);
      setGuests(data.guests);

      // Find my guest ID from the token info stored locally
      const token = guestApi.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setMyGuestId(payload.guestId);
        } catch {}
      }

      setLoading(false);
    } catch (err: any) {
      if (err.message === "Unauthorized") {
        router.push(`/join/${sessionCode}`);
        return;
      }
      setError(err.message || "Failed to load results");
      setLoading(false);
    }
  }, [sessionCode, router]);

  useEffect(() => {
    const token = guestApi.getToken();
    if (!token) {
      router.push(`/join/${sessionCode}`);
      return;
    }
    loadResults();
  }, [sessionCode, router, loadResults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C2D36]" />
      </div>
    );
  }

  // Build comparison data
  const wineResults = hostEntries.map((entry) => {
    const wineName = entry.adHocName || entry.bottleName || t("guest.untitled_wine");
    const photoUrl = entry.adHocPhotoUrl || entry.bottlePhotoUrl || entry.entryPhotoUrl;

    // Get all scores for this wine (guest entries where parentEntryId matches)
    const wineScores = allEntries
      .filter((e) => e.parentEntryId === entry.id && e.guestId !== null)
      .map((e) => ({
        guestId: e.guestId,
        guestName: e.guestName || t("guest.unknown_guest"),
        totalScore: e.totalScore || 0,
        notesShort: e.notesShort,
      }));

    // Also include host's own score (entries with no guestId and matching id)
    const hostEntry = allEntries.find(
      (e) => e.id === entry.id && e.guestId === null
    );

    const allScores = [
      ...(hostEntry && hostEntry.totalScore
        ? [{ guestId: "host", guestName: t("guest.host"), totalScore: hostEntry.totalScore, notesShort: hostEntry.notesShort }]
        : []),
      ...wineScores,
    ];

    const avgScore =
      allScores.length > 0
        ? Math.round(
            allScores.reduce((sum, s) => sum + s.totalScore, 0) / allScores.length
          )
        : 0;

    return {
      entryId: entry.id,
      wineName,
      producer: entry.bottleProducer,
      vintage: entry.bottleVintage,
      photoUrl,
      allScores,
      avgScore,
    };
  });

  // Fun stats
  const allGuestScores = allEntries.filter((e) => e.guestId !== null && e.totalScore);
  const guestScoreTotals: Record<string, { name: string; total: number; count: number }> = {};
  allGuestScores.forEach((e) => {
    if (!e.guestId) return;
    if (!guestScoreTotals[e.guestId]) {
      guestScoreTotals[e.guestId] = { name: e.guestName || t("guest.unknown_guest"), total: 0, count: 0 };
    }
    guestScoreTotals[e.guestId].total += e.totalScore || 0;
    guestScoreTotals[e.guestId].count += 1;
  });

  const guestAverages = Object.entries(guestScoreTotals)
    .map(([id, data]) => ({
      id,
      name: data.name,
      avg: data.count > 0 ? Math.round(data.total / data.count) : 0,
    }))
    .sort((a, b) => b.avg - a.avg);

  const mostGenerous = guestAverages[0];
  const harshestCritic = guestAverages[guestAverages.length - 1];

  // Top wine by average
  const topWine = [...wineResults].sort((a, b) => b.avgScore - a.avgScore)[0];

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#D4A847]/20 mb-3">
          <Trophy className="w-7 h-7 text-[#D4A847]" />
        </div>
        <h2 className="text-xl font-bold text-[#1A1A1A]">{t("guest.tasting_results")}</h2>
        <p className="text-[#8B7355] text-sm">{sessionName}</p>
      </div>

      {/* Fun stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {topWine && topWine.avgScore > 0 && (
          <div className="bg-white rounded-xl border border-[#E5E1DB] p-3 text-center">
            <Crown className="w-5 h-5 text-[#D4A847] mx-auto mb-1" />
            <p className="text-xs text-[#8B7355]">{t("guest.top_wine")}</p>
            <p className="text-sm font-bold text-[#1A1A1A] truncate">{topWine.wineName}</p>
            <p className="text-lg font-bold" style={{ color: getScoreColor(topWine.avgScore) }}>
              {topWine.avgScore}
            </p>
          </div>
        )}
        {mostGenerous && mostGenerous.avg > 0 && (
          <div className="bg-white rounded-xl border border-[#E5E1DB] p-3 text-center">
            <Star className="w-5 h-5 text-[#22C55E] mx-auto mb-1" />
            <p className="text-xs text-[#8B7355]">{t("guest.most_generous")}</p>
            <p className="text-sm font-bold text-[#1A1A1A] truncate">{mostGenerous.name}</p>
            <p className="text-lg font-bold text-[#22C55E]">avg {mostGenerous.avg}</p>
          </div>
        )}
        {harshestCritic && guestAverages.length > 1 && (
          <div className="bg-white rounded-xl border border-[#E5E1DB] p-3 text-center">
            <ThumbsDown className="w-5 h-5 text-[#EF4444] mx-auto mb-1" />
            <p className="text-xs text-[#8B7355]">{t("guest.harshest_critic")}</p>
            <p className="text-sm font-bold text-[#1A1A1A] truncate">{harshestCritic.name}</p>
            <p className="text-lg font-bold text-[#EF4444]">avg {harshestCritic.avg}</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-[#E5E1DB] p-3 text-center">
          <Users className="w-5 h-5 text-[#7C2D36] mx-auto mb-1" />
          <p className="text-xs text-[#8B7355]">{t("guest.tasters")}</p>
          <p className="text-2xl font-bold text-[#7C2D36]">{guests.length}</p>
        </div>
      </div>

      {/* Wine-by-wine comparison */}
      <div className="space-y-4">
        {wineResults.map((wine, idx) => (
          <div
            key={wine.entryId}
            className="bg-white rounded-2xl border border-[#E5E1DB] overflow-hidden"
          >
            {/* Wine header */}
            <div className="flex items-center gap-3 p-4 border-b border-[#E5E1DB]">
              <div className="w-10 h-10 rounded-xl bg-[#F5F0EB] flex items-center justify-center overflow-hidden flex-shrink-0">
                {wine.photoUrl ? (
                  <img
                    src={wine.photoUrl}
                    alt={wine.wineName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Wine className="w-5 h-5 text-[#7C2D36]/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#1A1A1A] truncate">
                  {idx + 1}. {wine.wineName}
                </p>
                {wine.producer && (
                  <p className="text-xs text-[#8B7355]">
                    {wine.producer}
                    {wine.vintage ? ` · ${wine.vintage}` : ""}
                  </p>
                )}
              </div>
              {wine.avgScore > 0 && (
                <div className="text-center">
                  <p className="text-xs text-[#8B7355]">avg</p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: getScoreColor(wine.avgScore) }}
                  >
                    {wine.avgScore}
                  </p>
                </div>
              )}
            </div>

            {/* Individual scores */}
            <div className="divide-y divide-[#F5F0EB]">
              {wine.allScores.map((score) => (
                <div
                  key={score.guestId}
                  className={`flex items-center justify-between px-4 py-3 ${
                    score.guestId === myGuestId ? "bg-[#7C2D36]/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#1A1A1A]">
                      {score.guestName}
                      {score.guestId === myGuestId && (
                        <span className="text-xs text-[#7C2D36] ml-1">({t("guest.you")})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: getScoreColor(score.totalScore) }}
                    >
                      {score.totalScore}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: getScoreColor(score.totalScore) + "15",
                        color: getScoreColor(score.totalScore),
                      }}
                    >
                      {t(getScoreLabelKey(score.totalScore))}
                    </span>
                  </div>
                </div>
              ))}
              {wine.allScores.length === 0 && (
                <div className="px-4 py-3 text-sm text-[#8B7355] text-center">
                  {t("guest.no_scores_yet")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Back button */}
      <div className="mt-6 pb-8">
        <button
          onClick={() => router.push(`/taste/${sessionCode}`)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#E5E1DB] text-[#1A1A1A] font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("guest.back_to_scoring")}
        </button>
      </div>
    </div>
  );
}
