"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Download, ChevronDown, Wine, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreInput } from "@/components/ui/score-input";
import { SearchInput } from "@/components/ui/search-input";
import { PhotoCapture } from "@/components/ui/photo-capture";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
}

interface Bottle {
  id: string;
  name: string;
  producer?: string;
  vintage?: number;
  photoUrl?: string;
}

interface ScoreData {
  appearance: number;
  nose: number;
  palate: number;
  finish: number;
  balance: number;
}

interface TastingEntry {
  id: string;
  bottleId?: string;
  bottle?: Bottle;
  adHocName?: string;
  photoUrl?: string;
  scores?: ScoreData;
  shortNotes?: string;
  longNotes?: string;
  tags?: string[];
  saveToCellar?: boolean;
  saveToCellarLocation?: string;
}

interface TastingSession {
  id: string;
  name: string;
  date: string;
  venue?: string;
  participants?: string;
  notes?: string;
  entries: TastingEntry[];
}

function getScore(scores?: ScoreData): number {
  if (!scores) return 0;
  return scores.appearance + scores.nose + scores.palate + scores.finish + scores.balance;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "bg-[#D4A847] text-white"; // gold
  if (score >= 80) return "bg-[#059669] text-white"; // green
  return "bg-[#E5E1DB] text-[#1A1A1A]"; // neutral
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

interface ExpandedEntryState {
  entryId: string;
  scores: ScoreData;
  shortNotes: string;
  longNotes: string;
  tags: string;
  isNew?: boolean;
  saveToCellar?: boolean;
  saveToCellarLocation?: string;
}

export default function TastingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tasting, setTasting] = useState<TastingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"entries" | "compare">("entries");
  const [expandedEntry, setExpandedEntry] = useState<ExpandedEntryState | null>(null);
  const [showAddFromCellar, setShowAddFromCellar] = useState(false);
  const [showAddAdHoc, setShowAddAdHoc] = useState(false);
  const [adHocName, setAdHocName] = useState("");
  const [adHocPhoto, setAdHocPhoto] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cellarBottles, setCellarBottles] = useState<Bottle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [sessionInfoExpanded, setSessionInfoExpanded] = useState(false);

  const fetchTasting = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get(`/tastings/${id}`);
      setTasting(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tasting:", err);
      setError("Failed to load tasting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchCellarBottles = useCallback(async () => {
    try {
      const params = new URLSearchParams({ inStock: "true" });
      if (searchQuery) {
        params.append("q", searchQuery);
      }
      const data = await api.get(`/bottles?${params.toString()}`);
      setCellarBottles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to fetch cellar bottles:", err);
      setCellarBottles([]);
    }
  }, [searchQuery]);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await api.get("/locations");
      setLocations(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    }
  }, []);

  useEffect(() => {
    fetchTasting();
    fetchLocations();
  }, [fetchTasting, fetchLocations]);

  useEffect(() => {
    if (showAddFromCellar) {
      fetchCellarBottles();
    }
  }, [showAddFromCellar, searchQuery, fetchCellarBottles]);

  const handleAddFromCellar = async (bottle: Bottle) => {
    try {
      setIsAddingEntry(true);
      const newEntry = await api.post(`/tastings/${id}/entries`, {
        bottleId: bottle.id,
      });

      setTasting((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: [...prev.entries, newEntry],
        };
      });

      setShowAddFromCellar(false);
      setSearchQuery("");
    } catch (err) {
      console.error("Failed to add entry:", err);
      setError("Failed to add entry. Please try again.");
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleAddAdHoc = async () => {
    if (!adHocName.trim()) {
      return;
    }

    try {
      setIsAddingEntry(true);

      let photoUrl: string | undefined;
      if (adHocPhoto) {
        const formData = new FormData();
        formData.append("file", adHocPhoto);
        const uploadRes = await api.fetch("/upload", {
          method: "POST",
          body: formData,
          headers: {},
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photoUrl = uploadData.url;
        }
      }

      const newEntry = await api.post(`/tastings/${id}/entries`, {
        adHocName: adHocName.trim(),
        photoUrl,
      });

      setTasting((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: [...prev.entries, newEntry],
        };
      });

      setShowAddAdHoc(false);
      setAdHocName("");
      setAdHocPhoto(null);
    } catch (err) {
      console.error("Failed to add ad-hoc entry:", err);
      setError("Failed to add entry. Please try again.");
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleExpandEntry = (entry: TastingEntry) => {
    const totalScore = getScore(entry.scores);
    setExpandedEntry({
      entryId: entry.id,
      scores: entry.scores || { appearance: 0, nose: 0, palate: 0, finish: 0, balance: 0 },
      shortNotes: entry.shortNotes || "",
      longNotes: entry.longNotes || "",
      tags: (entry.tags || []).join(", "),
      saveToCellar: entry.saveToCellar || false,
      saveToCellarLocation: entry.saveToCellarLocation || "",
    });
  };

  const handleSaveScores = async () => {
    if (!expandedEntry) return;

    try {
      const totalScore = getScore(expandedEntry.scores);
      const payload = {
        scores: expandedEntry.scores,
        shortNotes: expandedEntry.shortNotes || undefined,
        longNotes: expandedEntry.longNotes || undefined,
        tags: expandedEntry.tags
          ? expandedEntry.tags.split(",").map((t) => t.trim())
          : undefined,
        saveToCellar: expandedEntry.saveToCellar || undefined,
        saveToCellarLocation: expandedEntry.saveToCellarLocation || undefined,
      };

      await api.patch(`/tastings/${id}/entries/${expandedEntry.entryId}`, payload);

      setTasting((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: prev.entries.map((e) =>
            e.id === expandedEntry.entryId
              ? {
                  ...e,
                  scores: expandedEntry.scores,
                  shortNotes: expandedEntry.shortNotes,
                  longNotes: expandedEntry.longNotes,
                  tags: expandedEntry.tags ? expandedEntry.tags.split(",").map((t) => t.trim()) : [],
                  saveToCellar: expandedEntry.saveToCellar,
                  saveToCellarLocation: expandedEntry.saveToCellarLocation,
                }
              : e
          ),
        };
      });

      setExpandedEntry(null);
    } catch (err) {
      console.error("Failed to save scores:", err);
      setError("Failed to save scores. Please try again.");
    }
  };

  const downloadExport = async (format: "csv" | "pdf") => {
    try {
      const res = await api.fetch(`/tastings/${id}/export/${format}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasting-${id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download export:", err);
      setError(`Failed to download ${format.toUpperCase()}. Please try again.`);
    }
  };

  if (isLoading) {
    return <Loading variant="page" />;
  }

  if (!tasting) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <PageHeader title="Tasting" showBack />
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          <EmptyState
            icon={<Wine className="w-12 h-12" />}
            title="Tasting not found"
            description="This tasting session may have been deleted."
            action={{
              label: "Back to Tastings",
              onClick: () => router.push("/tastings"),
            }}
          />
        </div>
      </div>
    );
  }

  const sortedEntries = [...tasting.entries].sort((a, b) => {
    const scoreA = getScore(a.scores);
    const scoreB = getScore(b.scores);
    return scoreB - scoreA;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader title={tasting.name} showBack />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => setSessionInfoExpanded(!sessionInfoExpanded)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-[#E5E1DB] hover:bg-[#FDFBF7] transition-colors"
          >
            <div className="text-left">
              <p className="text-sm text-[#6B7280]">{formatDate(tasting.date)}</p>
              {tasting.venue && <p className="text-sm font-medium text-[#1A1A1A]">{tasting.venue}</p>}
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-[#6B7280] transition-transform",
                sessionInfoExpanded && "rotate-180"
              )}
            />
          </button>

          {sessionInfoExpanded && (
            <div className="mt-2 p-4 bg-white rounded-lg border border-[#E5E1DB] space-y-3">
              {tasting.participants && (
                <div>
                  <p className="text-xs font-medium text-[#6B7280] uppercase">Participants</p>
                  <p className="text-sm text-[#1A1A1A]">{tasting.participants}</p>
                </div>
              )}

              {tasting.notes && (
                <div>
                  <p className="text-xs font-medium text-[#6B7280] uppercase">Notes</p>
                  <p className="text-sm text-[#1A1A1A]">{tasting.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6 border-b border-[#E5E1DB]">
          <button
            onClick={() => setActiveTab("entries")}
            className={cn(
              "px-4 py-2 font-medium text-sm transition-colors border-b-2",
              activeTab === "entries"
                ? "text-[#7C2D36] border-b-[#7C2D36]"
                : "text-[#6B7280] border-b-transparent hover:text-[#1A1A1A]"
            )}
          >
            Entries
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={cn(
              "px-4 py-2 font-medium text-sm transition-colors border-b-2",
              activeTab === "compare"
                ? "text-[#7C2D36] border-b-[#7C2D36]"
                : "text-[#6B7280] border-b-transparent hover:text-[#1A1A1A]"
            )}
          >
            Compare
          </button>
        </div>

        {activeTab === "entries" && (
          <div className="space-y-6">
            {tasting.entries.length === 0 ? (
              <EmptyState
                icon={<Wine className="w-12 h-12" />}
                title="No entries yet"
                description="Add wines to start tasting."
              />
            ) : (
              <div className="space-y-3">
                {tasting.entries.map((entry) => {
                  const score = getScore(entry.scores);
                  const isExpanded = expandedEntry?.entryId === entry.id;
                  const name = entry.bottle?.name || entry.adHocName || "Unknown";

                  return (
                    <div key={entry.id}>
                      <Card
                        className="cursor-pointer transition-all hover:shadow-md active:shadow-sm p-4"
                        onClick={() => !isExpanded && handleExpandEntry(entry)}
                      >
                        <div className="flex gap-4 items-start">
                          <div className="flex-shrink-0">
                            {entry.photoUrl || entry.bottle?.photoUrl ? (
                              <img
                                src={entry.photoUrl || entry.bottle?.photoUrl}
                                alt={name}
                                className="w-16 h-20 rounded object-cover bg-[#F5F1EB]"
                              />
                            ) : (
                              <div className="w-16 h-20 rounded bg-[#F5F1EB] flex items-center justify-center">
                                <Wine className="w-8 h-8 text-[#6B7280]" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#1A1A1A] truncate">{name}</h4>

                            {entry.bottle?.vintage && (
                              <p className="text-sm text-[#6B7280]">{entry.bottle.vintage}</p>
                            )}

                            {entry.shortNotes && (
                              <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">
                                {entry.shortNotes}
                              </p>
                            )}

                            {entry.scores && (
                              <div className="mt-2 flex gap-1">
                                {[
                                  { label: "A", value: entry.scores.appearance },
                                  { label: "N", value: entry.scores.nose },
                                  { label: "P", value: entry.scores.palate },
                                  { label: "F", value: entry.scores.finish },
                                  { label: "B", value: entry.scores.balance },
                                ].map((cat) => (
                                  <div
                                    key={cat.label}
                                    className="flex flex-col items-center gap-0.5"
                                  >
                                    <div className="text-xs font-semibold text-[#7C2D36]">
                                      {cat.value}
                                    </div>
                                    <div className="text-xs text-[#6B7280]">{cat.label}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {score > 0 && (
                            <div className={cn("flex-shrink-0 px-3 py-1 rounded font-semibold text-white", getScoreColor(score))}>
                              {score}
                            </div>
                          )}
                        </div>
                      </Card>

                      {isExpanded && expandedEntry && (
                        <Card className="mt-2 p-4 bg-[#FDFBF7] border-[#D4A847]">
                          <div className="space-y-4">
                            <div className="text-sm font-medium text-[#1A1A1A]">
                              Total Score:{" "}
                              <span className="text-xl font-bold text-[#7C2D36]">
                                {getScore(expandedEntry.scores)}/100
                              </span>
                            </div>

                            <div className="space-y-4 bg-white rounded-lg p-4">
                              <ScoreInput
                                label="Appearance"
                                category="COLOR, CLARITY, VISCOSITY"
                                value={expandedEntry.scores.appearance}
                                onChange={(v) =>
                                  setExpandedEntry((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          scores: { ...prev.scores, appearance: v },
                                        }
                                      : null
                                  )
                                }
                              />

                              <ScoreInput
                                label="Nose"
                                category="AROMA, INTENSITY, COMPLEXITY"
                                value={expandedEntry.scores.nose}
                                onChange={(v) =>
                                  setExpandedEntry((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          scores: { ...prev.scores, nose: v },
                                        }
                                      : null
                                  )
                                }
                              />

                              <ScoreInput
                                label="Palate"
                                category="TASTE, WEIGHT, TEXTURE"
                                value={expandedEntry.scores.palate}
                                onChange={(v) =>
                                  setExpandedEntry((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          scores: { ...prev.scores, palate: v },
                                        }
                                      : null
                                  )
                                }
                              />

                              <ScoreInput
                                label="Finish"
                                category="AFTERTASTE, LENGTH, CHARACTER"
                                value={expandedEntry.scores.finish}
                                onChange={(v) =>
                                  setExpandedEntry((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          scores: { ...prev.scores, finish: v },
                                        }
                                      : null
                                  )
                                }
                              />

                              <ScoreInput
                                label="Balance"
                                category="OVERALL HARMONY"
                                value={expandedEntry.scores.balance}
                                onChange={(v) =>
                                  setExpandedEntry((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          scores: { ...prev.scores, balance: v },
                                        }
                                      : null
                                  )
                                }
                              />
                            </div>

                            <Input
                              label="Short Notes"
                              placeholder="Quick impressions..."
                              value={expandedEntry.shortNotes}
                              onChange={(e) =>
                                setExpandedEntry((prev) =>
                                  prev
                                    ? { ...prev, shortNotes: e.target.value }
                                    : null
                                )
                              }
                            />

                            <div className="flex flex-col gap-2">
                              <label className="text-sm font-medium text-[#1A1A1A]">
                                Long Notes
                              </label>
                              <textarea
                                placeholder="Detailed tasting notes..."
                                value={expandedEntry.longNotes}
                                onChange={(e) =>
                                  setExpandedEntry((prev) =>
                                    prev
                                      ? { ...prev, longNotes: e.target.value }
                                      : null
                                  )
                                }
                                className="flex min-h-24 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0"
                              />
                            </div>

                            <Input
                              label="Tags"
                              placeholder="Comma-separated tags..."
                              value={expandedEntry.tags}
                              onChange={(e) =>
                                setExpandedEntry((prev) =>
                                  prev ? { ...prev, tags: e.target.value } : null
                                )
                              }
                            />

                            <div className="flex gap-3 pt-4">
                              <Button
                                onClick={handleSaveScores}
                                className="flex-1"
                              >
                                Save Scores
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setExpandedEntry(null)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddFromCellar(!showAddFromCellar)}
                className="flex-1"
                disabled={isAddingEntry}
              >
                Add from Cellar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddAdHoc(!showAddAdHoc)}
                className="flex-1"
                disabled={isAddingEntry}
              >
                Add Ad-hoc
              </Button>
            </div>

            {showAddFromCellar && (
              <Card className="p-4 space-y-3 border-[#D4A847]">
                <SearchInput
                  placeholder="Search bottles..."
                  onChangeDebounced={setSearchQuery}
                />

                {cellarBottles.length === 0 ? (
                  <p className="text-sm text-[#6B7280] text-center py-4">
                    {searchQuery ? "No bottles found" : "No bottles in cellar"}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cellarBottles.map((bottle) => (
                      <button
                        key={bottle.id}
                        onClick={() => handleAddFromCellar(bottle)}
                        className="w-full flex gap-3 p-3 rounded-md hover:bg-[#F5F1EB] transition-colors text-left"
                        disabled={isAddingEntry}
                      >
                        {bottle.photoUrl ? (
                          <img
                            src={bottle.photoUrl}
                            alt={bottle.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-[#F5F1EB] flex items-center justify-center">
                            <Wine className="w-6 h-6 text-[#6B7280]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1A1A1A] truncate">
                            {bottle.name}
                          </p>
                          {bottle.vintage && (
                            <p className="text-xs text-[#6B7280]">{bottle.vintage}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowAddFromCellar(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </Card>
            )}

            {showAddAdHoc && (
              <Card className="p-4 space-y-4 border-[#D4A847]">
                <Input
                  label="Wine Name"
                  placeholder="e.g. Mystery Cabernet"
                  value={adHocName}
                  onChange={(e) => setAdHocName(e.target.value)}
                  required
                />

                <div>
                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                    Photo (optional)
                  </label>
                  <PhotoCapture
                    onPhotoSelected={setAdHocPhoto}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddAdHoc}
                    disabled={!adHocName.trim() || isAddingEntry}
                    isLoading={isAddingEntry}
                    className="flex-1"
                  >
                    Add Entry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddAdHoc(false);
                      setAdHocName("");
                      setAdHocPhoto(null);
                    }}
                    disabled={isAddingEntry}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "compare" && (
          <div className="space-y-6">
            {sortedEntries.length === 0 ? (
              <EmptyState
                title="No entries to compare"
                description="Add some wines first."
              />
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E1DB]">
                        <th className="text-left p-3 font-semibold text-[#1A1A1A]">
                          Rank
                        </th>
                        <th className="text-left p-3 font-semibold text-[#1A1A1A]">
                          Wine
                        </th>
                        <th className="text-center p-3 font-semibold text-[#1A1A1A]">
                          Score
                        </th>
                        <th className="text-center p-3 font-semibold text-[#6B7280]">
                          A
                        </th>
                        <th className="text-center p-3 font-semibold text-[#6B7280]">
                          N
                        </th>
                        <th className="text-center p-3 font-semibold text-[#6B7280]">
                          P
                        </th>
                        <th className="text-center p-3 font-semibold text-[#6B7280]">
                          F
                        </th>
                        <th className="text-center p-3 font-semibold text-[#6B7280]">
                          B
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEntries.map((entry, index) => {
                        const score = getScore(entry.scores);
                        const name = entry.bottle?.name || entry.adHocName || "Unknown";
                        return (
                          <tr
                            key={entry.id}
                            className="border-b border-[#E5E1DB] hover:bg-[#F5F1EB]"
                          >
                            <td className="p-3 font-bold text-[#7C2D36]">
                              #{index + 1}
                            </td>
                            <td className="p-3 font-medium text-[#1A1A1A]">
                              {name}
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="score">{score}</Badge>
                            </td>
                            <td className="p-3 text-center text-[#6B7280]">
                              {entry.scores?.appearance || 0}
                            </td>
                            <td className="p-3 text-center text-[#6B7280]">
                              {entry.scores?.nose || 0}
                            </td>
                            <td className="p-3 text-center text-[#6B7280]">
                              {entry.scores?.palate || 0}
                            </td>
                            <td className="p-3 text-center text-[#6B7280]">
                              {entry.scores?.finish || 0}
                            </td>
                            <td className="p-3 text-center text-[#6B7280]">
                              {entry.scores?.balance || 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => downloadExport("csv")}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadExport("pdf")}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
