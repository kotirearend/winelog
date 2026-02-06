"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Download, ChevronDown, Wine, Beer, X, Camera } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { PhotoCapture } from "@/components/ui/photo-capture";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { FredCelebration } from "@/components/ui/fred-celebration";
import { useAuth } from "@/lib/auth-context";
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

interface TastingEntry {
  id: string;
  bottleId?: string;
  adHocName?: string;
  adHocPhotoUrl?: string;
  entryPhotoUrl?: string;
  totalScore?: number;
  tastingNotes?: Record<string, string>;
  notesShort?: string;
  notesLong?: string;
  tags?: string[];
  saveToCellar?: boolean;
  bottleName?: string;
  bottleProducer?: string;
  bottleVintage?: number;
  bottlePhotoUrl?: string;
}

interface TastingSession {
  id: string;
  name: string;
  tastedAt: string;
  venue?: string;
  participants?: string;
  notes?: string;
  summary?: string;
  entries?: TastingEntry[];
}

interface ExpandedEntryState {
  entryId: string;
  totalScore: number;
  tastingNotes: {
    // Wine WSET fields
    clarity?: string;
    intensityAppearance?: string;
    colour?: string;
    condition?: string;
    intensityNose?: string;
    aromaCharacteristics?: string;
    development?: string;
    sweetness?: string;
    acidity?: string;
    tannin?: string;
    alcohol?: string;
    body?: string;
    flavourIntensity?: string;
    flavourCharacteristics?: string;
    finish?: string;
    qualityLevel?: string;
    readiness?: string;
    // Beer BJCP fields
    beerColour?: string;
    beerClarity?: string;
    headRetention?: string;
    headColour?: string;
    maltAroma?: string;
    hopAroma?: string;
    fermentationAroma?: string;
    otherAroma?: string;
    maltFlavour?: string;
    hopFlavour?: string;
    bitterness?: string;
    fermentationFlavour?: string;
    balance?: string;
    finishAftertaste?: string;
    beerBody?: string;
    carbonation?: string;
    warmth?: string;
    creaminess?: string;
    overallImpression?: string;
    // Casual mode fields
    casualLooks?: string;
    casualSmell?: string;
    casualTaste?: string;
    casualDrinkability?: string;
    casualValue?: string;
    casualBuyAgain?: string;
    casualVibes?: string;
  };
  notesLong: string;
}

function getQualityLabel(qualityLevel?: string): string {
  const labels: Record<string, string> = {
    faulty: "Faulty",
    poor: "Poor",
    acceptable: "Acceptable",
    good: "Good",
    "very good": "Very Good",
    outstanding: "Outstanding",
    // Beer-specific
    problematic: "Problematic",
    average: "Average",
    // Casual-specific
    nah: "Nah",
    "it's alright": "It's Alright",
    solid: "Solid",
    "proper good": "Proper Good",
    elite: "Elite",
  };
  return labels[qualityLevel || ""] || "Not Rated";
}

function getQualityColor(qualityLevel?: string): string {
  const colors: Record<string, string> = {
    faulty: "bg-red-100 text-red-800",
    poor: "bg-orange-100 text-orange-800",
    acceptable: "bg-yellow-100 text-yellow-800",
    good: "bg-blue-100 text-blue-800",
    "very good": "bg-[#D4A847] text-white",
    outstanding: "bg-[#7C2D36] text-white",
    // Beer-specific
    problematic: "bg-red-100 text-red-800",
    average: "bg-yellow-100 text-yellow-800",
    // Casual-specific
    nah: "bg-red-100 text-red-800",
    "it's alright": "bg-yellow-100 text-yellow-800",
    solid: "bg-blue-100 text-blue-800",
    "proper good": "bg-[#D4A847] text-white",
    elite: "bg-[#7C2D36] text-white",
  };
  return colors[qualityLevel || ""] || "bg-[#E5E1DB] text-[#1A1A1A]";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            value === option
              ? "bg-[#7C2D36] text-white"
              : "border border-[#E5E1DB] text-[#1A1A1A] bg-white hover:border-[#7C2D36]"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function TastingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { beverageType, scoringMode } = useAuth();
  const isBeer = beverageType === "beer";
  const isCasual = scoringMode === "casual";

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
  const [sessionSummary, setSessionSummary] = useState("");
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFredCelebration, setShowFredCelebration] = useState(false);
  const [entryPhoto, setEntryPhoto] = useState<File | null>(null);
  const [entryPhotoPreview, setEntryPhotoPreview] = useState<string | null>(null);
  const entryPhotoInputRef = useRef<HTMLInputElement>(null);

  const fetchTasting = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get(`/tastings/${id}`);
      setTasting(data);
      setSessionSummary(data.summary || "");
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
      const params = new URLSearchParams({ inStock: "true", beverageType });
      if (searchQuery) {
        params.append("q", searchQuery);
      }
      const data = await api.get(`/bottles?${params.toString()}`);
      setCellarBottles(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to fetch cellar bottles:", err);
      setCellarBottles([]);
    }
  }, [searchQuery, beverageType]);

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
          entries: [...(prev.entries || []), newEntry],
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
        const uploadData = await api.uploadFile("/uploads", adHocPhoto);
        photoUrl = uploadData.url;
      }

      const newEntry = await api.post(`/tastings/${id}/entries`, {
        adHocName: adHocName.trim(),
        adHocPhotoUrl: photoUrl,
      });

      setTasting((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: [...(prev.entries || []), newEntry],
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
    setExpandedEntry({
      entryId: entry.id,
      totalScore: entry.totalScore || 0,
      tastingNotes: entry.tastingNotes || {},
      notesLong: entry.notesLong || "",
    });
    setEntryPhoto(null);
    setEntryPhotoPreview(entry.entryPhotoUrl || null);
  };

  const handleSaveScores = async () => {
    if (!expandedEntry) return;

    try {
      setIsSaving(true);

      // Upload photo if selected
      let photoUrl: string | undefined;
      if (entryPhoto) {
        const uploadData = await api.uploadFile("/uploads", entryPhoto);
        photoUrl = uploadData.url;
      }

      const payload: Record<string, unknown> = {
        totalScore: expandedEntry.totalScore,
        tastingNotes: expandedEntry.tastingNotes,
        notesLong: expandedEntry.notesLong || undefined,
      };
      if (photoUrl) {
        payload.entryPhotoUrl = photoUrl;
      }

      await api.patch(`/tastings/${id}/entries/${expandedEntry.entryId}`, payload);

      setTasting((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: (prev.entries || []).map((e) =>
            e.id === expandedEntry.entryId
              ? {
                  ...e,
                  totalScore: expandedEntry.totalScore,
                  tastingNotes: expandedEntry.tastingNotes,
                  notesLong: expandedEntry.notesLong,
                  entryPhotoUrl: photoUrl || e.entryPhotoUrl,
                }
              : e
          ),
        };
      });

      // Check celebration conditions after updating local state
      if (expandedEntry.totalScore === 100) {
        // Build the updated entries list to check 4x perfect
        const updatedEntries = (tasting?.entries || []).map((e) =>
          e.id === expandedEntry.entryId
            ? { ...e, totalScore: expandedEntry.totalScore }
            : e
        );
        const allPerfect = updatedEntries.length >= 4 &&
          updatedEntries.every((e) => e.totalScore === 100);

        if (allPerfect) {
          // FULL FRED MODE — bouncing Fred celebration
          setShowFredCelebration(true);
        } else {
          // Single 100 — just the beefy soundbite
          try {
            const audio = new Audio("/beefy.mp3");
            audio.volume = 1.0;
            audio.play();
          } catch (audioErr) {
            console.error("Could not play soundbite:", audioErr);
          }
        }
      }

      setExpandedEntry(null);
      setEntryPhoto(null);
      setEntryPhotoPreview(null);
    } catch (err) {
      console.error("Failed to save scores:", err);
      setError("Failed to save scores. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSummary = async () => {
    try {
      setIsSavingSummary(true);
      await api.patch(`/tastings/${id}`, { summary: sessionSummary });
      setTasting((prev) => prev ? { ...prev, summary: sessionSummary } : prev);
    } catch (err) {
      console.error("Failed to save summary:", err);
    } finally {
      setIsSavingSummary(false);
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

  const sortedEntries = [...(tasting.entries || [])].sort((a, b) => {
    const scoreA = a.totalScore || 0;
    const scoreB = b.totalScore || 0;
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
              <p className="text-sm text-[#6B7280]">{formatDate(tasting.tastedAt)}</p>
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

              {/* Session Summary */}
              <div className="pt-3 border-t border-[#E5E1DB]">
                <p className="text-xs font-medium text-[#6B7280] uppercase mb-2">Session Summary</p>
                <p className="text-xs text-[#6B7280] mb-2">What stood out? Winners? Themes?</p>
                <textarea
                  placeholder="Write your session summary..."
                  value={sessionSummary}
                  onChange={(e) => setSessionSummary(e.target.value)}
                  className="flex min-h-24 w-full rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20"
                />
                <Button
                  variant="gold"
                  onClick={handleSaveSummary}
                  isLoading={isSavingSummary}
                  disabled={isSavingSummary}
                  className="mt-2 rounded-xl"
                  size="sm"
                >
                  Save Summary
                </Button>
              </div>
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
            {(tasting.entries || []).length === 0 ? (
              <EmptyState
                icon={isBeer ? <Beer className="w-12 h-12" /> : <Wine className="w-12 h-12" />}
                title="No entries yet"
                description={isBeer ? "Add beers to start tasting." : "Add wines to start tasting."}
              />
            ) : (
              <div className="space-y-3">
                {(tasting.entries || []).map((entry) => {
                  const score = entry.totalScore || 0;
                  const qualityLevel = entry.tastingNotes?.qualityLevel;
                  const isExpanded = expandedEntry?.entryId === entry.id;
                  const name = entry.bottleName || entry.adHocName || "Unknown";

                  return (
                    <div key={entry.id}>
                      <Card
                        className="cursor-pointer transition-all hover:shadow-md active:shadow-sm p-4"
                        onClick={() => !isExpanded && handleExpandEntry(entry)}
                      >
                        <div className="flex gap-4 items-start">
                          <div className="flex-shrink-0">
                            {entry.entryPhotoUrl || entry.adHocPhotoUrl || entry.bottlePhotoUrl ? (
                              <img
                                src={entry.entryPhotoUrl || entry.adHocPhotoUrl || entry.bottlePhotoUrl}
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

                            {entry.bottleVintage && (
                              <p className="text-sm text-[#6B7280]">{entry.bottleVintage}</p>
                            )}

                            {entry.notesLong && (
                              <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">
                                {entry.notesLong}
                              </p>
                            )}

                            {qualityLevel && (
                              <div className="mt-2 flex gap-2 items-center">
                                <Badge variant="score" className={getQualityColor(qualityLevel)}>
                                  {getQualityLabel(qualityLevel)}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {score > 0 && (
                            <div className="flex-shrink-0 text-right">
                              <div className="text-2xl font-bold text-[#7C2D36]">
                                {score}
                              </div>
                              <div className="text-xs text-[#6B7280]">/ 100</div>
                            </div>
                          )}
                        </div>
                      </Card>

                      {isExpanded && expandedEntry && (
                        <Card className="mt-2 p-6 bg-white border-[#D4A847]">
                          <div className="space-y-6">
                            {/* Optional Photo */}
                            <div>
                              <input
                                ref={entryPhotoInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setEntryPhoto(file);
                                    const reader = new FileReader();
                                    reader.onloadend = () => setEntryPhotoPreview(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                              {entryPhotoPreview ? (
                                <div className="relative inline-block">
                                  <img
                                    src={entryPhotoPreview}
                                    alt="Tasting photo"
                                    className="w-full max-h-48 rounded-xl object-cover border border-[#E5E1DB]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEntryPhoto(null);
                                      setEntryPhotoPreview(null);
                                      if (entryPhotoInputRef.current) entryPhotoInputRef.current.value = "";
                                    }}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => entryPhotoInputRef.current?.click()}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#E5E1DB] text-[#6B7280] hover:border-[#7C2D36] hover:text-[#7C2D36] transition-colors"
                                >
                                  <Camera className="w-4 h-4" />
                                  <span className="text-sm font-medium">Add Photo (optional)</span>
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-[#1A1A1A]">
                                Overall Quality Score
                              </label>
                              <div className="flex items-center gap-4">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={expandedEntry.totalScore}
                                  onChange={(e) =>
                                    setExpandedEntry((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            totalScore: parseInt(e.target.value, 10),
                                          }
                                        : null
                                    )
                                  }
                                  className="flex-1 h-2 bg-[#E5E1DB] rounded-lg appearance-none cursor-pointer"
                                  style={{
                                    background: `linear-gradient(to right, #7C2D36 0%, #7C2D36 ${expandedEntry.totalScore}%, #E5E1DB ${expandedEntry.totalScore}%, #E5E1DB 100%)`,
                                  }}
                                />
                                <div className="text-2xl font-bold text-[#7C2D36] w-12 text-right">
                                  {expandedEntry.totalScore}
                                </div>
                              </div>
                            </div>

                            {/* === CASUAL MODE SCORING === */}
                            {isCasual ? (
                              <>
                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#22C55E] px-4 py-2 rounded-lg mb-4">
                                    {isBeer ? "LOOKS" : "LOOKS"}
                                  </h3>
                                  <p className="text-xs text-[#6B7280] mb-3">How&apos;s it looking in the glass?</p>
                                  <ChipSelect
                                    options={["rough", "alright", "proper nice", "gorgeous"]}
                                    value={expandedEntry.tastingNotes.casualLooks}
                                    onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, casualLooks: v } } : null)}
                                  />
                                </div>

                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#22C55E] px-4 py-2 rounded-lg mb-4">
                                    SMELL
                                  </h3>
                                  <p className="text-xs text-[#6B7280] mb-3">Give it a sniff — what&apos;s the vibe?</p>
                                  <ChipSelect
                                    options={["off-putting", "nowt special", "nice", "lovely", "incredible"]}
                                    value={expandedEntry.tastingNotes.casualSmell}
                                    onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, casualSmell: v } } : null)}
                                  />
                                </div>

                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#22C55E] px-4 py-2 rounded-lg mb-4">
                                    TASTE
                                  </h3>
                                  <p className="text-xs text-[#6B7280] mb-3">The important bit — how does it taste?</p>
                                  <ChipSelect
                                    options={["rank", "meh", "decent", "banging", "unreal"]}
                                    value={expandedEntry.tastingNotes.casualTaste}
                                    onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, casualTaste: v } } : null)}
                                  />
                                </div>

                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#22C55E] px-4 py-2 rounded-lg mb-4">
                                    DRINKABILITY
                                  </h3>
                                  <p className="text-xs text-[#6B7280] mb-3">{isBeer ? "Could you session these?" : "Could you smash a few of these?"}</p>
                                  <ChipSelect
                                    options={["one and done", "couple more", "session material", "dangerously moreish"]}
                                    value={expandedEntry.tastingNotes.casualDrinkability}
                                    onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, casualDrinkability: v } } : null)}
                                  />
                                </div>

                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#22C55E] px-4 py-2 rounded-lg mb-4">
                                    VALUE
                                  </h3>
                                  <p className="text-xs text-[#6B7280] mb-3">Worth the price tag?</p>
                                  <ChipSelect
                                    options={["robbery", "bit steep", "fair enough", "bargain"]}
                                    value={expandedEntry.tastingNotes.casualValue}
                                    onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, casualValue: v } } : null)}
                                  />
                                </div>

                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#22C55E] px-4 py-2 rounded-lg mb-4">
                                    BUY AGAIN?
                                  </h3>
                                  <p className="text-xs text-[#6B7280] mb-3">Would you get it again?</p>
                                  <ChipSelect
                                    options={["no chance", "maybe", "yeah definitely", "buying a case"]}
                                    value={expandedEntry.tastingNotes.casualBuyAgain}
                                    onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, casualBuyAgain: v } } : null)}
                                  />
                                </div>

                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#22C55E] px-4 py-2 rounded-lg mb-4">
                                    THE VERDICT
                                  </h3>
                                  <p className="text-xs text-[#6B7280] mb-3">Sum it up — what&apos;s the final word?</p>
                                  <ChipSelect
                                    options={["nah", "it's alright", "solid", "proper good", "elite"]}
                                    value={expandedEntry.tastingNotes.qualityLevel}
                                    onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, qualityLevel: v } } : null)}
                                  />
                                  <div className="mt-4">
                                    <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Quick Vibes</label>
                                    <textarea
                                      placeholder={isBeer ? "What stood out? Would you recommend it to a mate?" : "What stood out? Food pairing? Occasion?"}
                                      value={expandedEntry.tastingNotes.casualVibes || ""}
                                      onChange={(e) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, casualVibes: e.target.value } } : null)}
                                      className="flex min-h-16 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-0"
                                    />
                                  </div>
                                </div>
                              </>
                            ) : isBeer ? (
                              <>
                            {/* === BEER BJCP SCORING === */}
                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#B45309] px-4 py-2 rounded-lg mb-4">
                                    APPEARANCE
                                  </h3>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Colour</label>
                                      <ChipSelect
                                        options={["straw", "gold", "amber", "copper", "brown", "dark brown", "black"]}
                                        value={expandedEntry.tastingNotes.beerColour}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, beerColour: v } } : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Clarity</label>
                                      <ChipSelect
                                        options={["brilliant", "clear", "slightly hazy", "hazy", "opaque"]}
                                        value={expandedEntry.tastingNotes.beerClarity}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, beerClarity: v } } : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Head Retention</label>
                                      <ChipSelect
                                        options={["none", "poor", "moderate", "good", "excellent"]}
                                        value={expandedEntry.tastingNotes.headRetention}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, headRetention: v } } : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Head Colour</label>
                                      <ChipSelect
                                        options={["white", "off-white", "ivory", "tan", "brown"]}
                                        value={expandedEntry.tastingNotes.headColour}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, headColour: v } } : null)}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#B45309] px-4 py-2 rounded-lg mb-4">
                                    AROMA
                                  </h3>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Malt Aroma</label>
                                      <textarea
                                        placeholder="e.g. biscuit, caramel, roast, chocolate, bread"
                                        value={expandedEntry.tastingNotes.maltAroma || ""}
                                        onChange={(e) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, maltAroma: e.target.value } } : null)}
                                        className="flex min-h-16 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309] focus:ring-offset-0"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Hop Aroma</label>
                                      <textarea
                                        placeholder="e.g. floral, citrus, pine, tropical, herbal, spicy"
                                        value={expandedEntry.tastingNotes.hopAroma || ""}
                                        onChange={(e) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, hopAroma: e.target.value } } : null)}
                                        className="flex min-h-16 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309] focus:ring-offset-0"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Fermentation Character</label>
                                      <textarea
                                        placeholder="e.g. fruity esters, phenolic, clean, yeasty"
                                        value={expandedEntry.tastingNotes.fermentationAroma || ""}
                                        onChange={(e) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, fermentationAroma: e.target.value } } : null)}
                                        className="flex min-h-16 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309] focus:ring-offset-0"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#B45309] px-4 py-2 rounded-lg mb-4">
                                    FLAVOUR
                                  </h3>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Malt Flavour</label>
                                      <textarea
                                        placeholder="e.g. sweet, toasty, biscuit, coffee, chocolate"
                                        value={expandedEntry.tastingNotes.maltFlavour || ""}
                                        onChange={(e) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, maltFlavour: e.target.value } } : null)}
                                        className="flex min-h-16 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309] focus:ring-offset-0"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Hop Flavour</label>
                                      <textarea
                                        placeholder="e.g. citrus, pine, herbal, grassy, earthy"
                                        value={expandedEntry.tastingNotes.hopFlavour || ""}
                                        onChange={(e) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, hopFlavour: e.target.value } } : null)}
                                        className="flex min-h-16 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309] focus:ring-offset-0"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Bitterness</label>
                                      <ChipSelect
                                        options={["low", "moderate", "assertive", "aggressive"]}
                                        value={expandedEntry.tastingNotes.bitterness}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, bitterness: v } } : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Balance</label>
                                      <ChipSelect
                                        options={["malt-forward", "balanced", "hop-forward", "roasty", "tart"]}
                                        value={expandedEntry.tastingNotes.balance}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, balance: v } } : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Finish / Aftertaste</label>
                                      <ChipSelect
                                        options={["short", "medium", "long", "lingering"]}
                                        value={expandedEntry.tastingNotes.finishAftertaste}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, finishAftertaste: v } } : null)}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#B45309] px-4 py-2 rounded-lg mb-4">
                                    MOUTHFEEL
                                  </h3>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Body</label>
                                      <ChipSelect
                                        options={["light", "medium-light", "medium", "medium-full", "full"]}
                                        value={expandedEntry.tastingNotes.beerBody}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, beerBody: v } } : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Carbonation</label>
                                      <ChipSelect
                                        options={["flat", "low", "moderate", "high", "effervescent"]}
                                        value={expandedEntry.tastingNotes.carbonation}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, carbonation: v } } : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Warmth</label>
                                      <ChipSelect
                                        options={["none", "slight", "noticeable", "hot"]}
                                        value={expandedEntry.tastingNotes.warmth}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, warmth: v } } : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Creaminess / Texture</label>
                                      <ChipSelect
                                        options={["thin", "smooth", "creamy", "oily", "astringent"]}
                                        value={expandedEntry.tastingNotes.creaminess}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, creaminess: v } } : null)}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-[#E5E1DB] pt-6">
                                  <h3 className="text-lg font-bold text-white bg-[#B45309] px-4 py-2 rounded-lg mb-4">
                                    OVERALL
                                  </h3>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Quality Level</label>
                                      <ChipSelect
                                        options={["problematic", "poor", "average", "good", "very good", "outstanding"]}
                                        value={expandedEntry.tastingNotes.qualityLevel}
                                        onChange={(v) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, qualityLevel: v } } : null)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Overall Impression</label>
                                      <textarea
                                        placeholder="Style accuracy, drinkability, standout characteristics..."
                                        value={expandedEntry.tastingNotes.overallImpression || ""}
                                        onChange={(e) => setExpandedEntry((prev) => prev ? { ...prev, tastingNotes: { ...prev.tastingNotes, overallImpression: e.target.value } } : null)}
                                        className="flex min-h-16 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309] focus:ring-offset-0"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                            {/* === WINE WSET SCORING === */}
                            <div className="border-t border-[#E5E1DB] pt-6">
                              <h3 className="text-lg font-bold text-white bg-[#7C2D36] px-4 py-2 rounded-lg mb-4">
                                APPEARANCE
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Clarity
                                  </label>
                                  <ChipSelect
                                    options={["clear", "hazy"]}
                                    value={expandedEntry.tastingNotes.clarity}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                clarity: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Intensity
                                  </label>
                                  <ChipSelect
                                    options={["pale", "medium", "deep"]}
                                    value={expandedEntry.tastingNotes.intensityAppearance}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                intensityAppearance: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Colour
                                  </label>
                                  <ChipSelect
                                    options={[
                                      "lemon-green",
                                      "lemon",
                                      "gold",
                                      "amber",
                                      "brown",
                                      "pink",
                                      "salmon",
                                      "orange",
                                      "purple",
                                      "ruby",
                                      "garnet",
                                      "tawny",
                                    ]}
                                    value={expandedEntry.tastingNotes.colour}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                colour: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-[#E5E1DB] pt-6">
                              <h3 className="text-lg font-bold text-white bg-[#7C2D36] px-4 py-2 rounded-lg mb-4">
                                NOSE
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Condition
                                  </label>
                                  <ChipSelect
                                    options={["clean", "unclean"]}
                                    value={expandedEntry.tastingNotes.condition}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                condition: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Intensity
                                  </label>
                                  <ChipSelect
                                    options={["light", "medium(-)", "medium", "medium(+)", "pronounced"]}
                                    value={expandedEntry.tastingNotes.intensityNose}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                intensityNose: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Aroma Characteristics
                                  </label>
                                  <textarea
                                    placeholder="e.g. citrus, oak, vanilla, floral"
                                    value={expandedEntry.tastingNotes.aromaCharacteristics || ""}
                                    onChange={(e) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                aromaCharacteristics: e.target.value,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                    className="flex min-h-16 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0"
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Development
                                  </label>
                                  <ChipSelect
                                    options={["youthful", "developing", "fully developed", "tired"]}
                                    value={expandedEntry.tastingNotes.development}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                development: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-[#E5E1DB] pt-6">
                              <h3 className="text-lg font-bold text-white bg-[#7C2D36] px-4 py-2 rounded-lg mb-4">
                                PALATE
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Sweetness
                                  </label>
                                  <ChipSelect
                                    options={["dry", "off-dry", "medium-dry", "medium-sweet", "sweet", "luscious"]}
                                    value={expandedEntry.tastingNotes.sweetness}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                sweetness: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Acidity
                                  </label>
                                  <ChipSelect
                                    options={["low", "medium(-)", "medium", "medium(+)", "high"]}
                                    value={expandedEntry.tastingNotes.acidity}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                acidity: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Tannin
                                  </label>
                                  <ChipSelect
                                    options={["low", "medium(-)", "medium", "medium(+)", "high"]}
                                    value={expandedEntry.tastingNotes.tannin}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                tannin: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Alcohol
                                  </label>
                                  <ChipSelect
                                    options={["low", "medium", "high"]}
                                    value={expandedEntry.tastingNotes.alcohol}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                alcohol: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Body
                                  </label>
                                  <ChipSelect
                                    options={["light", "medium(-)", "medium", "medium(+)", "full"]}
                                    value={expandedEntry.tastingNotes.body}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                body: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Flavour Intensity
                                  </label>
                                  <ChipSelect
                                    options={["light", "medium(-)", "medium", "medium(+)", "pronounced"]}
                                    value={expandedEntry.tastingNotes.flavourIntensity}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                flavourIntensity: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Flavour Characteristics
                                  </label>
                                  <textarea
                                    placeholder="e.g. berry, chocolate, spice, mineral"
                                    value={expandedEntry.tastingNotes.flavourCharacteristics || ""}
                                    onChange={(e) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                flavourCharacteristics: e.target.value,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                    className="flex min-h-16 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0"
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Finish
                                  </label>
                                  <ChipSelect
                                    options={["short", "medium(-)", "medium", "medium(+)", "long"]}
                                    value={expandedEntry.tastingNotes.finish}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                finish: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-[#E5E1DB] pt-6">
                              <h3 className="text-lg font-bold text-white bg-[#7C2D36] px-4 py-2 rounded-lg mb-4">
                                CONCLUSIONS
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Quality Level
                                  </label>
                                  <ChipSelect
                                    options={["faulty", "poor", "acceptable", "good", "very good", "outstanding"]}
                                    value={expandedEntry.tastingNotes.qualityLevel}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                qualityLevel: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                    Readiness
                                  </label>
                                  <ChipSelect
                                    options={["too young", "can drink now but has potential", "drink now", "too old"]}
                                    value={expandedEntry.tastingNotes.readiness}
                                    onChange={(v) =>
                                      setExpandedEntry((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              tastingNotes: {
                                                ...prev.tastingNotes,
                                                readiness: v,
                                              },
                                            }
                                          : null
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                              </>
                            )}

                            <div className="border-t border-[#E5E1DB] pt-6">
                              <label className="text-sm font-medium text-[#1A1A1A] block mb-2">
                                Tasting Notes
                              </label>
                              <textarea
                                placeholder="Detailed explanation of your score and overall impressions..."
                                value={expandedEntry.notesLong}
                                onChange={(e) =>
                                  setExpandedEntry((prev) =>
                                    prev
                                      ? { ...prev, notesLong: e.target.value }
                                      : null
                                  )
                                }
                                className="flex min-h-24 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0"
                              />
                            </div>

                            <div className="flex gap-3 pt-4">
                              <Button
                                onClick={handleSaveScores}
                                disabled={isSaving}
                                isLoading={isSaving}
                                className="flex-1"
                              >
                                Save Tasting
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setExpandedEntry(null)}
                                disabled={isSaving}
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
                  label={isBeer ? "Beer Name" : "Wine Name"}
                  placeholder={isBeer ? "e.g. Mystery IPA" : "e.g. Mystery Cabernet"}
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
                description={isBeer ? "Add some beers first." : "Add some wines first."}
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
                          {isBeer ? "Beer" : "Wine"}
                        </th>
                        <th className="text-center p-3 font-semibold text-[#1A1A1A]">
                          Quality Level
                        </th>
                        <th className="text-center p-3 font-semibold text-[#1A1A1A]">
                          Score
                        </th>
                        <th className="text-center p-3 font-semibold text-[#6B7280]">
                          {isCasual ? "Taste" : isBeer ? "Body" : "Body"}
                        </th>
                        <th className="text-center p-3 font-semibold text-[#6B7280]">
                          {isCasual ? "Drinkability" : isBeer ? "Bitterness" : "Finish"}
                        </th>
                        <th className="text-center p-3 font-semibold text-[#6B7280]">
                          {isCasual ? "Value" : isBeer ? "Carbonation" : "Acidity"}
                        </th>
                        <th className="text-center p-3 font-semibold text-[#6B7280]">
                          {isCasual ? "Buy Again?" : isBeer ? "Balance" : "Sweetness"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEntries.map((entry, index) => {
                        const score = entry.totalScore || 0;
                        const qualityLevel = entry.tastingNotes?.qualityLevel;
                        const name = entry.bottleName || entry.adHocName || "Unknown";
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
                              {qualityLevel ? (
                                <Badge variant="score" className={getQualityColor(qualityLevel)}>
                                  {getQualityLabel(qualityLevel)}
                                </Badge>
                              ) : (
                                <span className="text-[#6B7280]">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold text-[#7C2D36]">
                              {score || "-"}
                            </td>
                            <td className="p-3 text-center text-[#6B7280]">
                              {(isCasual ? entry.tastingNotes?.casualTaste : isBeer ? entry.tastingNotes?.beerBody : entry.tastingNotes?.body) || "-"}
                            </td>
                            <td className="p-3 text-center text-[#6B7280]">
                              {(isCasual ? entry.tastingNotes?.casualDrinkability : isBeer ? entry.tastingNotes?.bitterness : entry.tastingNotes?.finish) || "-"}
                            </td>
                            <td className="p-3 text-center text-[#6B7280]">
                              {(isCasual ? entry.tastingNotes?.casualValue : isBeer ? entry.tastingNotes?.carbonation : entry.tastingNotes?.acidity) || "-"}
                            </td>
                            <td className="p-3 text-center text-[#6B7280]">
                              {(isCasual ? entry.tastingNotes?.casualBuyAgain : isBeer ? entry.tastingNotes?.balance : entry.tastingNotes?.sweetness) || "-"}
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

      {/* Fred Celebration Overlay */}
      {showFredCelebration && (
        <FredCelebration onClose={() => setShowFredCelebration(false)} />
      )}
    </div>
  );
}
