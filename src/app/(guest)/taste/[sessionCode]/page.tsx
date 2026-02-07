"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Wine,
  ChevronDown,
  ChevronUp,
  Check,
  Star,
  Send,
  Eye,
  Loader2,
} from "lucide-react";
import { guestApi } from "@/lib/guest-api-client";
import { ChipSelect } from "@/components/ui/chip-select";

// Casual scoring categories
const CASUAL_CATEGORIES = [
  { key: "casualLooks", label: "Looks" },
  { key: "casualSmell", label: "Smell" },
  { key: "casualTaste", label: "Taste" },
  { key: "casualDrinkability", label: "Drinkability" },
  { key: "casualValue", label: "Value" },
  { key: "casualBuyAgain", label: "Buy Again?" },
];

const CASUAL_OPTIONS: Record<string, string[]> = {
  casualLooks: ["Rough", "Alright", "Pretty", "Proper Fit", "Gorgeous"],
  casualSmell: ["Rank", "Meh", "Nice", "Lovely", "Unreal"],
  casualTaste: ["Grim", "OK", "Tasty", "Banging", "Life-Changing"],
  casualDrinkability: ["One Sip", "Few Glasses", "Easy Drinking", "Sessionable", "Dangerous"],
  casualValue: ["Rip Off", "Fair Enough", "Good Deal", "Bargain", "Steal"],
  casualBuyAgain: ["Never", "Maybe", "Probably", "Deffo", "Buying a Case"],
};

// Score mapping for casual mode
const CASUAL_SCORE_MAP: Record<string, number> = {
  // Each category scored out of ~16-17 points, 6 categories = ~100 total
  Rough: 3, Alright: 7, Pretty: 10, "Proper Fit": 14, Gorgeous: 17,
  Rank: 3, Meh: 7, Nice: 10, Lovely: 14, Unreal: 17,
  Grim: 3, OK: 7, Tasty: 10, Banging: 14, "Life-Changing": 17,
  "One Sip": 3, "Few Glasses": 7, "Easy Drinking": 10, Sessionable: 14, Dangerous: 16,
  "Rip Off": 3, "Fair Enough": 7, "Good Deal": 10, Bargain: 14, Steal: 16,
  Never: 3, Maybe: 7, Probably: 10, Deffo: 14, "Buying a Case": 17,
};

interface HostEntry {
  id: string;
  adHocName: string | null;
  adHocPhotoUrl: string | null;
  bottleId: string | null;
  bottleName: string | null;
  bottleProducer: string | null;
  bottleVintage: number | null;
  bottlePhotoUrl: string | null;
  entryPhotoUrl: string | null;
}

interface GuestScore {
  parentEntryId: string;
  totalScore: number | null;
  tastingNotes: Record<string, any> | null;
  notesShort: string | null;
}

export default function GuestTastingPage() {
  const router = useRouter();
  const params = useParams();
  const sessionCode = (params.sessionCode as string).toUpperCase();

  const [loading, setLoading] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [hostEntries, setHostEntries] = useState<HostEntry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, Record<string, string>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savedEntries, setSavedEntries] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [allSubmitted, setAllSubmitted] = useState(false);
  const [error, setError] = useState("");

  const loadSession = useCallback(async () => {
    try {
      const data = await guestApi.get(`/guest-sessions/${sessionCode}`);
      setSessionName(data.session.name);
      setHostEntries(data.hostEntries);

      // Restore any previously saved scores
      const saved = new Set<string>();
      if (data.myEntries && data.myEntries.length > 0) {
        const restoredScores: Record<string, Record<string, string>> = {};
        const restoredNotes: Record<string, string> = {};
        data.myEntries.forEach((entry: any) => {
          if (entry.parentEntryId) {
            saved.add(entry.parentEntryId);
            if (entry.tastingNotes) {
              restoredScores[entry.parentEntryId] = entry.tastingNotes;
            }
            if (entry.notesShort) {
              restoredNotes[entry.parentEntryId] = entry.notesShort;
            }
          }
        });
        setScores(restoredScores);
        setNotes(restoredNotes);
        setSavedEntries(saved);

        // If all are saved already, mark as submitted
        if (saved.size >= data.hostEntries.length) {
          setAllSubmitted(true);
        }
      }

      setLoading(false);
    } catch (err: any) {
      if (err.message === "Unauthorized") {
        router.push(`/join/${sessionCode}`);
        return;
      }
      setError(err.message || "Failed to load session");
      setLoading(false);
    }
  }, [sessionCode, router]);

  useEffect(() => {
    const token = guestApi.getToken();
    if (!token) {
      router.push(`/join/${sessionCode}`);
      return;
    }
    loadSession();
  }, [sessionCode, router, loadSession]);

  const calculateTotalScore = (entryScores: Record<string, string>): number => {
    let total = 0;
    CASUAL_CATEGORIES.forEach(({ key }) => {
      const val = entryScores[key];
      if (val && CASUAL_SCORE_MAP[val]) {
        total += CASUAL_SCORE_MAP[val];
      }
    });
    return Math.min(100, total);
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    setError("");

    try {
      // Only submit entries that have at least one category scored
      const entriesToSubmit = hostEntries.filter((entry) => {
        const entryScores = scores[entry.id] || {};
        return Object.keys(entryScores).length > 0;
      });

      if (entriesToSubmit.length === 0) {
        setError("Score at least one wine before submitting!");
        setSubmitting(false);
        return;
      }

      for (const entry of entriesToSubmit) {
        const entryScores = scores[entry.id] || {};
        const totalScore = calculateTotalScore(entryScores);

        await guestApi.post(
          `/guest-sessions/${sessionCode}/entries/${entry.id}/score`,
          {
            totalScore,
            tastingNotes: Object.keys(entryScores).length > 0 ? entryScores : null,
            notesShort: notes[entry.id] || null,
          }
        );

        setSavedEntries((prev) => new Set([...prev, entry.id]));
      }

      setAllSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit scores");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C2D36]" />
      </div>
    );
  }

  if (allSubmitted) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          Scores Submitted!
        </h2>
        <p className="text-[#8B7355] mb-6">
          Nice one. Your tasting notes are in.
        </p>
        <button
          onClick={() => router.push(`/taste/${sessionCode}/results`)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium"
          style={{ backgroundColor: "#7C2D36" }}
        >
          <Eye className="w-5 h-5" />
          View Results
        </button>
      </div>
    );
  }

  const scoredCount = Object.keys(scores).filter(
    (id) => Object.keys(scores[id]).length > 0
  ).length;

  return (
    <div>
      {/* Session header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#1A1A1A]">{sessionName}</h2>
        <p className="text-[#8B7355] text-sm mt-1">
          Score each wine below — tap to expand
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Wine entries */}
      <div className="space-y-3">
        {hostEntries.map((entry, idx) => {
          const wineName = entry.adHocName || entry.bottleName || "Wine";
          const photoUrl = entry.adHocPhotoUrl || entry.bottlePhotoUrl || entry.entryPhotoUrl;
          const isExpanded = expandedEntry === entry.id;
          const entryScores = scores[entry.id] || {};
          const scoredCategories = Object.keys(entryScores).length;
          const isSaved = savedEntries.has(entry.id);
          const totalScore = calculateTotalScore(entryScores);

          return (
            <div
              key={entry.id}
              className="bg-white rounded-2xl border border-[#E5E1DB] overflow-hidden shadow-sm"
            >
              {/* Wine header - tap to expand */}
              <button
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() =>
                  setExpandedEntry(isExpanded ? null : entry.id)
                }
              >
                {/* Photo */}
                <div className="w-12 h-12 rounded-xl bg-[#F5F0EB] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={wineName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Wine className="w-6 h-6 text-[#7C2D36]/40" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1A1A1A] truncate">
                    {idx + 1}. {wineName}
                  </p>
                  {entry.bottleProducer && (
                    <p className="text-xs text-[#8B7355] truncate">
                      {entry.bottleProducer}
                      {entry.bottleVintage ? ` · ${entry.bottleVintage}` : ""}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {isSaved ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  ) : scoredCategories > 0 ? (
                    <div className="text-xs font-medium text-[#7C2D36] bg-[#7C2D36]/10 px-2 py-1 rounded-full">
                      {totalScore}
                    </div>
                  ) : null}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#8B7355]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#8B7355]" />
                  )}
                </div>
              </button>

              {/* Expanded scoring panel */}
              {isExpanded && (
                <div className="border-t border-[#E5E1DB] p-4 space-y-5">
                  {CASUAL_CATEGORIES.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-[#22C55E] mb-2">
                        {label}
                      </label>
                      <ChipSelect
                        options={CASUAL_OPTIONS[key]}
                        value={entryScores[key]}
                        onChange={(val) =>
                          setScores((prev) => ({
                            ...prev,
                            [entry.id]: {
                              ...prev[entry.id],
                              [key]: val,
                            },
                          }))
                        }
                        accentColor="#22C55E"
                      />
                    </div>
                  ))}

                  {/* Quick notes */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Quick Notes
                    </label>
                    <textarea
                      value={notes[entry.id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [entry.id]: e.target.value,
                        }))
                      }
                      placeholder="Any thoughts..."
                      maxLength={500}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1DB] bg-[#FDFBF7] text-[#1A1A1A] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 text-sm resize-none"
                    />
                  </div>

                  {/* Score display */}
                  {scoredCategories > 0 && (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <Star className="w-5 h-5 text-[#D4A847]" />
                      <span className="text-lg font-bold text-[#1A1A1A]">
                        {totalScore}
                      </span>
                      <span className="text-sm text-[#8B7355]">/ 100</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit button */}
      <div className="mt-6 pb-8">
        <button
          onClick={handleSubmitAll}
          disabled={submitting || scoredCount === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-medium text-lg transition-all disabled:opacity-50"
          style={{ backgroundColor: "#7C2D36" }}
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          <span>
            {submitting
              ? "Submitting..."
              : `Submit All Scores (${scoredCount}/${hostEntries.length})`}
          </span>
        </button>
      </div>
    </div>
  );
}
