"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wine, Beer, MapPin, Grape, X, ChevronDown, ChevronUp, Grid3X3, List } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n-context";
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
  grapes?: string[];
  country?: string;
  region?: string;
  status?: string;
  photoUrl?: string;
  quantity: number;
  locationId?: string;
  subLocationText?: string;
  priceAmount?: string;
  priceCurrency?: string;
}

export default function BottlesPage() {
  const router = useRouter();
  const { beverageType } = useAuth();
  const { t, language } = useTranslation();
  const isBeer = beverageType === "beer";
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [allBottlesRaw, setAllBottlesRaw] = useState<Bottle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("in_cellar");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedGrape, setSelectedGrape] = useState<string | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

  const fetchLocations = useCallback(async () => {
    try {
      const data = await api.get("/locations");
      setLocations(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
      setLocations([]);
    }
  }, []);

  const fetchBottles = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("beverageType", beverageType);

      if (search) {
        params.append("q", search);
      }

      if (selectedLocationId) {
        params.append("locationId", selectedLocationId);
      }

      const data = await api.get(`/bottles?${params.toString()}`);
      const list = Array.isArray(data) ? data : data.data || [];
      setAllBottlesRaw(list);

      // Filter by status client-side
      let filtered = list;
      if (statusFilter !== "all") {
        filtered = filtered.filter((b: Bottle) => (b.status || "in_cellar") === statusFilter);
      }

      // Filter by region
      if (selectedRegion) {
        filtered = filtered.filter((b: Bottle) => {
          const bottleRegion = b.region || b.country || "";
          return bottleRegion.toLowerCase().includes(selectedRegion.toLowerCase());
        });
      }

      // Filter by grape
      if (selectedGrape) {
        filtered = filtered.filter((b: Bottle) =>
          b.grapes?.some((g) => g.toLowerCase() === selectedGrape.toLowerCase())
        );
      }

      // Filter by shelf/sub-location
      if (selectedShelf) {
        filtered = filtered.filter((b: Bottle) =>
          b.subLocationText?.toLowerCase() === selectedShelf.toLowerCase()
        );
      }

      setBottles(filtered);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch bottles:", err);
      setError("Failed to load cellar. Please try again.");
      setBottles([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedLocationId, statusFilter, beverageType, selectedRegion, selectedGrape, selectedShelf]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    fetchBottles();
  }, [fetchBottles]);

  // Derive available regions and grapes from current bottles
  const availableRegions = useMemo(() => {
    const regionSet = new Map<string, number>();
    allBottlesRaw.forEach((b) => {
      const region = b.region || b.country;
      if (region) {
        const key = region;
        regionSet.set(key, (regionSet.get(key) || 0) + 1);
      }
    });
    return Array.from(regionSet.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [allBottlesRaw]);

  const availableGrapes = useMemo(() => {
    const grapeSet = new Map<string, number>();
    allBottlesRaw.forEach((b) => {
      if (b.grapes) {
        b.grapes.forEach((g) => {
          grapeSet.set(g, (grapeSet.get(g) || 0) + 1);
        });
      }
    });
    return Array.from(grapeSet.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [allBottlesRaw]);

  const availableShelves = useMemo(() => {
    const shelfSet = new Map<string, number>();
    allBottlesRaw.forEach((b) => {
      if (b.subLocationText) {
        shelfSet.set(b.subLocationText, (shelfSet.get(b.subLocationText) || 0) + 1);
      }
    });
    return Array.from(shelfSet.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [allBottlesRaw]);

  const activeFilterCount = [selectedLocationId, selectedRegion, selectedGrape, selectedShelf].filter(Boolean).length;

  const handleAddButton = () => {
    router.push("/bottles/new");
  };

  const handleBottleClick = (bottleId: string) => {
    router.push(`/bottles/${bottleId}`);
  };

  const clearAllFilters = () => {
    setSelectedLocationId(null);
    setSelectedRegion(null);
    setSelectedGrape(null);
    setSelectedShelf(null);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language || "en-US");
    } catch {
      return dateString;
    }
  };

  if (isLoading && bottles.length === 0) {
    return <Loading variant="page" />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader
        title={t(`bottles.page_title_${beverageType}`)}
        variant="wine"
        action={
          <Button
            variant="gold"
            onClick={handleAddButton}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t(`bottles.add_${beverageType}`)}</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
        <SearchInput
          placeholder={t(`bottles.search_placeholder_${beverageType}`)}
          onChangeDebounced={setSearch}
        />

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-[#F5F1EB] p-1 rounded-xl">
          {[
            { value: "in_cellar", label: t("bottles.in_stock") },
            { value: "consumed", label: t("bottles.consumed") },
            { value: "archived", label: t("bottles.archived") },
            { value: "all", label: t("bottles.all") },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all duration-200",
                statusFilter === tab.value
                  ? "bg-white text-[#7C2D36] shadow-sm"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
            showFilters || activeFilterCount > 0
              ? "border-[#7C2D36]/30 bg-[#7C2D36]/5 text-[#7C2D36]"
              : "border-[#E5E1DB] bg-white text-[#6B7280]"
          )}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{t("bottles.filters")}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#7C2D36] text-white text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-[#E5E1DB] p-4 space-y-4">
            {/* Active filter tags */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {selectedLocationId && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#7C2D36]/10 text-[#7C2D36] text-xs font-medium">
                    {locations.find((l) => l.id === selectedLocationId)?.name}
                    <button onClick={() => setSelectedLocationId(null)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedRegion && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#7C2D36]/10 text-[#7C2D36] text-xs font-medium">
                    <MapPin className="w-3 h-3" />
                    {selectedRegion}
                    <button onClick={() => setSelectedRegion(null)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedGrape && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-xs font-medium">
                    <Grape className="w-3 h-3" />
                    {selectedGrape}
                    <button onClick={() => setSelectedGrape(null)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedShelf && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D4A847]/10 text-[#D4A847] text-xs font-medium">
                    {selectedShelf}
                    <button onClick={() => setSelectedShelf(null)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#6B7280] underline"
                >
                  {t("bottles.clear_all")}
                </button>
              </div>
            )}

            {/* Location */}
            {locations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">{t("bottles.location")}</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedLocationId(null)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      selectedLocationId === null
                        ? "bg-[#7C2D36] text-white"
                        : "bg-[#F5F1EB] text-[#6B7280] hover:bg-[#E5E1DB]"
                    )}
                  >
                    {t("bottles.all")}
                  </button>
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocationId(selectedLocationId === loc.id ? null : loc.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        selectedLocationId === loc.id
                          ? "bg-[#7C2D36] text-white"
                          : "bg-[#F5F1EB] text-[#6B7280] hover:bg-[#E5E1DB]"
                      )}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Region */}
            {availableRegions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {t("bottles.region")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {availableRegions.slice(0, 12).map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => setSelectedRegion(selectedRegion === name ? null : name)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        selectedRegion === name
                          ? "bg-[#7C2D36] text-white"
                          : "bg-[#F5F1EB] text-[#6B7280] hover:bg-[#E5E1DB]"
                      )}
                    >
                      {name} <span className="opacity-60">({count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grape */}
            {availableGrapes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                  <Grape className="w-3 h-3 inline mr-1" />
                  {t(isBeer ? "bottles.style" : "bottles.grape")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {availableGrapes.slice(0, 12).map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => setSelectedGrape(selectedGrape === name ? null : name)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        selectedGrape === name
                          ? "bg-[#22C55E] text-white"
                          : "bg-[#F5F1EB] text-[#6B7280] hover:bg-[#E5E1DB]"
                      )}
                    >
                      {name} <span className="opacity-60">({count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shelf / Sub-location */}
            {availableShelves.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                  {t("bottles.shelf")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {availableShelves.map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => setSelectedShelf(selectedShelf === name ? null : name)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        selectedShelf === name
                          ? "bg-[#D4A847] text-white"
                          : "bg-[#F5F1EB] text-[#6B7280] hover:bg-[#E5E1DB]"
                      )}
                    >
                      {name} <span className="opacity-60">({count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Results count + view toggle */}
        {!isLoading && bottles.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#8B7355] font-medium">
              {bottles.length} {isBeer ? "beer" : "bottle"}{bottles.length !== 1 ? "s" : ""}
              {activeFilterCount > 0 ? " matching filters" : ""}
            </p>
            <div className="flex items-center gap-1 bg-[#F5F1EB] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === "grid"
                    ? "bg-white text-[#7C2D36] shadow-sm"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                )}
                title={t("bottles.grid_view")}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  viewMode === "compact"
                    ? "bg-white text-[#7C2D36] shadow-sm"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                )}
                title={t("bottles.compact_view")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {bottles.length === 0 && !isLoading ? (
          <EmptyState
            icon={isBeer ? <Beer className="w-12 h-12 text-amber-700" /> : <Wine className="w-12 h-12 text-[#7C2D36]" />}
            title={activeFilterCount > 0 ? t("bottles.no_results") : t(`bottles.empty_${beverageType}`)}
            description={activeFilterCount > 0 ? t("bottles.try_adjusting") : t(`bottles.empty_desc_${beverageType}`)}
            action={activeFilterCount > 0 ? {
              label: t("bottles.clear_filters"),
              onClick: clearAllFilters,
            } : {
              label: t(`bottles.add_${beverageType}`),
              onClick: handleAddButton,
            }}
          />
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {bottles.map((bottle) => (
                  <div
                    key={bottle.id}
                    onClick={() => handleBottleClick(bottle.id)}
                    className="bg-white rounded-2xl border border-[#E5E1DB] overflow-hidden cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
                  >
                    {/* Photo area */}
                    {bottle.photoUrl ? (
                      <div className="aspect-[3/2] w-full overflow-hidden bg-[#F5F1EB]">
                        <img
                          src={bottle.photoUrl}
                          alt={bottle.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/2] w-full bg-gradient-to-br from-[#F5F1EB] to-[#E5E1DB] flex items-center justify-center">
                        {isBeer ? (
                          <Beer className="w-12 h-12 text-[#B45309]/25" />
                        ) : (
                          <Wine className="w-12 h-12 text-[#7C2D36]/25" />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      {bottle.producer && (
                        <p className="text-[10px] font-bold text-[#7C2D36] uppercase tracking-widest truncate mb-0.5">
                          {bottle.producer}
                        </p>
                      )}
                      <h3 className="font-bold text-[15px] text-[#1A1A1A] leading-snug line-clamp-2">
                        {bottle.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {bottle.vintage && (
                          <span className="text-[11px] font-semibold text-[#7C2D36] bg-[#FCE4E8] px-2 py-0.5 rounded-md">
                            {bottle.vintage}
                          </span>
                        )}
                        {(bottle.country || bottle.region) && (
                          <span className="text-[11px] text-[#8B7355] truncate">
                            {[bottle.region, bottle.country].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                      {bottle.grapes && bottle.grapes.length > 0 && (
                        <p className="text-[11px] text-[#9CA3AF] mt-1.5 truncate">
                          {bottle.grapes.join(" · ")}
                        </p>
                      )}
                      <div className="mt-2.5 flex items-center justify-between">
                        {bottle.quantity > 1 ? (
                          <span className="text-[11px] font-bold text-[#7C2D36] bg-[#7C2D36]/10 px-2 py-0.5 rounded-full">
                            {t("bottles.qty", { count: bottle.quantity })}
                          </span>
                        ) : (
                          <span />
                        )}
                        {bottle.priceAmount && (
                          <span className="text-[11px] font-bold text-[#D4A847]">
                            {bottle.priceCurrency || "£"}{Number(bottle.priceAmount).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Compact list view */
              <div className="space-y-1">
                {bottles.map((bottle) => (
                  <div
                    key={bottle.id}
                    onClick={() => handleBottleClick(bottle.id)}
                    className="flex items-center gap-3 bg-white rounded-xl border border-[#E5E1DB] px-3 py-2.5 cursor-pointer hover:shadow-sm active:scale-[0.99] transition-all"
                  >
                    {/* Tiny thumbnail or icon */}
                    {bottle.photoUrl ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F5F1EB] flex-shrink-0">
                        <img src={bottle.photoUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5F1EB] to-[#E5E1DB] flex items-center justify-center flex-shrink-0">
                        {isBeer ? (
                          <Beer className="w-5 h-5 text-[#B45309]/30" />
                        ) : (
                          <Wine className="w-5 h-5 text-[#7C2D36]/30" />
                        )}
                      </div>
                    )}

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">
                          {bottle.name}
                        </h3>
                        {bottle.vintage && (
                          <span className="text-[10px] font-bold text-[#7C2D36] bg-[#FCE4E8] px-1.5 py-0.5 rounded flex-shrink-0">
                            {bottle.vintage}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B7280] truncate">
                        {[bottle.producer, bottle.region || bottle.country].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {/* Right side: qty + price */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {bottle.quantity > 1 && (
                        <span className="text-[10px] font-bold text-[#7C2D36] bg-[#7C2D36]/10 px-1.5 py-0.5 rounded-full">
                          ×{bottle.quantity}
                        </span>
                      )}
                      {bottle.priceAmount && (
                        <span className="text-[11px] font-bold text-[#D4A847]">
                          {bottle.priceCurrency || "£"}{Number(bottle.priceAmount).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
