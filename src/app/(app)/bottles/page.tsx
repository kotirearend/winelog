"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wine, Beer } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("in_cellar");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

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

      // Filter by beverage type
      params.append("beverageType", beverageType);

      if (search) {
        params.append("q", search);
      }

      if (selectedLocationId) {
        params.append("locationId", selectedLocationId);
      }

      const data = await api.get(`/bottles?${params.toString()}`);
      let list = Array.isArray(data) ? data : data.data || [];

      // Filter by status client-side
      if (statusFilter !== "all") {
        list = list.filter((b: Bottle) => (b.status || "in_cellar") === statusFilter);
      }

      setBottles(list);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch bottles:", err);
      setError("Failed to load cellar. Please try again.");
      setBottles([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedLocationId, statusFilter, beverageType]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    fetchBottles();
  }, [fetchBottles]);

  const handleAddButton = () => {
    router.push("/bottles/new");
  };

  const handleBottleClick = (bottleId: string) => {
    router.push(`/bottles/${bottleId}`);
  };

  const handleFilterChange = (locationId: string | null) => {
    setSelectedLocationId(locationId);
  };

  if (isLoading) {
    return <Loading variant="page" />;
  }

  return (
    <div className="min-h-screen bg-cream">
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

      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
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

        {/* Location filter chips */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => handleFilterChange(null)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-800 focus-visible:ring-offset-2 flex-shrink-0",
              selectedLocationId === null
                ? "bg-wine-800 text-white shadow-lg shadow-wine-800/30 scale-[1.02]"
                : "bg-cream-dark text-wine-900 hover:bg-warm-border hover:shadow-md"
            )}
          >
            All
          </button>

          {locations.map((location) => (
            <button
              key={location.id}
              onClick={() => handleFilterChange(location.id)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-800 focus-visible:ring-offset-2 flex-shrink-0",
                selectedLocationId === location.id
                  ? "bg-wine-800 text-white shadow-lg shadow-wine-800/30 scale-[1.02]"
                  : "bg-cream-dark text-wine-900 hover:bg-warm-border hover:shadow-md"
              )}
            >
              {location.name}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {bottles.length === 0 ? (
          <EmptyState
            icon={isBeer ? <Beer className="w-12 h-12 text-amber-700" /> : <Wine className="w-12 h-12 text-wine-800" />}
            title={isBeer ? "No beers in your collection yet" : "No bottles in your cellar yet"}
            description={isBeer ? "Add your first beer to get started tracking your beer collection." : "Add your first bottle to get started tracking your wine collection."}
            action={{
              label: isBeer ? "Add Beer" : "Add Bottle",
              onClick: handleAddButton,
            }}
          />
        ) : (
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 lg:grid-cols-3">
            {bottles.map((bottle) => (
              <Card
                key={bottle.id}
                variant="elevated"
                className="card-hover cursor-pointer rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
                onClick={() => handleBottleClick(bottle.id)}
              >
                <div className="flex">
                  {/* Left accent / photo */}
                  {bottle.photoUrl ? (
                    <img
                      src={bottle.photoUrl}
                      alt={bottle.name}
                      className="w-24 h-auto object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-2 flex-shrink-0 bg-gradient-to-b from-[#7C2D36] to-[#D4A847] rounded-l-2xl" />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0 p-4">
                    {/* Producer */}
                    {bottle.producer && (
                      <p className="text-[10px] font-bold text-[#7C2D36] uppercase tracking-widest truncate mb-0.5">
                        {bottle.producer}
                      </p>
                    )}

                    {/* Name */}
                    <h3 className="font-bold text-base text-[#1A1A1A] leading-tight line-clamp-2">
                      {bottle.name}
                    </h3>

                    {/* Vintage + Origin line */}
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      {bottle.vintage && (
                        <span className="text-xs font-semibold text-[#7C2D36] bg-[#FCE4E8] px-2 py-0.5 rounded-md">
                          {bottle.vintage}
                        </span>
                      )}
                      {(bottle.country || bottle.region) && (
                        <span className="text-xs text-[#6B7280]">
                          {[bottle.country, bottle.region].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>

                    {/* Grapes */}
                    {bottle.grapes && bottle.grapes.length > 0 && (
                      <p className="text-xs text-[#9CA3AF] mt-1 truncate">
                        {bottle.grapes.join(", ")}
                      </p>
                    )}

                    {/* Bottom row: qty + price */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {bottle.quantity > 1 && (
                          <span className="text-xs font-bold text-[#7C2D36] bg-[#7C2D36]/10 px-2 py-0.5 rounded-full">
                            ×{bottle.quantity}
                          </span>
                        )}
                      </div>
                      {bottle.priceAmount && (
                        <span className="text-xs font-bold text-[#D4A847]">
                          {bottle.priceCurrency || "GBP"} {Number(bottle.priceAmount).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
