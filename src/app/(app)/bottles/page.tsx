"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wine, Beer, MapPin, Grape, X, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
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
  grapes?: string[];
  country?: string;
  region?: string;
  status?: string;
  photoUrl?: string;
  quantity: number;
  locationId?: string;
  priceAmount?: string;
  priceCurrency?: string;
}

export default function BottlesPage() {
  const router = useRouter();
  const { beverageType } = useAuth();
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
  const [showFilters, setShowFilters] = useState(false);

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

      setBottles(filtered);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch bottles:", err);
      setError("Failed to load cellar. Please try again.");
      setBottles([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedLocationId, statusFilter, beverageType, selectedRegion, selectedGrape]);

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

  const activeFilterCount = [selectedLocationId, selectedRegion, selectedGrape].filter(Boolean).length;

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
  };

  if (isLoading && bottles.length === 0) {
    return <Loading variant="page" />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader
        title={isBeer ? "My Collection" : "My Cellar"}
        variant="wine"
        action={
          <Button
            variant="gold"
            onClick={handleAddButton}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Bottle</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
        <SearchInput
          placeholder="Search by name or producer..."
          onChangeDebounced={setSearch}
        />

        {/* Status filter tabs */}
        <div className="flex gap-1 bg-[#F5F1EB] p-1 rounded-xl">
          {[
            { value: "in_cellar", label: "In Cellar" },
            { value: "consumed", label: "Consumed" },
            { value: "archived", label: "Archived" },
            { value: "all", label: "All" },
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
            <span>Filters</span>
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
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#6B7280] underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Location */}
            {locations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Location</p>
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
                    All
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
                  Region
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
                  Grape
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
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Results count */}
        {!isLoading && bottles.length > 0 && (
          <p className="text-xs text-[#8B7355] font-medium">
            {bottles.length} {isBeer ? "beer" : "bottle"}{bottles.length !== 1 ? "s" : ""}
            {activeFilterCount > 0 ? " matching filters" : ""}
          </p>
        )}

        {bottles.length === 0 && !isLoading ? (
          <EmptyState
            icon={isBeer ? <Beer className="w-12 h-12 text-amber-700" /> : <Wine className="w-12 h-12 text-[#7C2D36]" />}
            title={activeFilterCount > 0 ? "No matches" : (isBeer ? "No beers in your collection yet" : "No bottles in your cellar yet")}
            description={activeFilterCount > 0 ? "Try adjusting your filters." : (isBeer ? "Add your first beer to get started." : "Add your first bottle to get started.")}
            action={activeFilterCount > 0 ? {
              label: "Clear Filters",
              onClick: clearAllFilters,
            } : {
              label: isBeer ? "Add Beer" : "Add Bottle",
              onClick: handleAddButton,
            }}
          />
        ) : (
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
                  <div className="h-2 w-full bg-gradient-to-r from-[#7C2D36] via-[#A31D3D] to-[#D4A847]" />
                )}

                {/* Content */}
                <div className="p-4">
                  {/* Producer */}
                  {bottle.producer && (
                    <p className="text-[10px] font-bold text-[#7C2D36] uppercase tracking-widest truncate mb-0.5">
                      {bottle.producer}
                    </p>
                  )}

                  {/* Name */}
                  <h3 className="font-bold text-[15px] text-[#1A1A1A] leading-snug line-clamp-2">
                    {bottle.name}
                  </h3>

                  {/* Meta row */}
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

                  {/* Grapes */}
                  {bottle.grapes && bottle.grapes.length > 0 && (
                    <p className="text-[11px] text-[#9CA3AF] mt-1.5 truncate">
                      {bottle.grapes.join(" · ")}
                    </p>
                  )}

                  {/* Bottom row: qty + price */}
                  <div className="mt-2.5 flex items-center justify-between">
                    {bottle.quantity > 1 ? (
                      <span className="text-[11px] font-bold text-[#7C2D36] bg-[#7C2D36]/10 px-2 py-0.5 rounded-full">
                        ×{bottle.quantity}
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
        )}
      </div>
    </div>
  );
}
