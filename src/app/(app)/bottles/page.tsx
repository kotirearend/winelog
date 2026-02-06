"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wine } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  quantity: number;
  locationId: string;
  priceAmount?: string;
  priceCurrency?: string;
}

export default function BottlesPage() {
  const router = useRouter();
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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
      const params = new URLSearchParams({ inStock: "true" });

      if (search) {
        params.append("q", search);
      }

      if (selectedLocationId) {
        params.append("locationId", selectedLocationId);
      }

      const data = await api.get(`/bottles?${params.toString()}`);
      setBottles(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch bottles:", err);
      setError("Failed to load cellar. Please try again.");
      setBottles([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedLocationId]);

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
        title="My Cellar"
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
            icon={<Wine className="w-12 h-12 text-wine-800" />}
            title="No bottles in your cellar yet"
            description="Add your first bottle to get started tracking your wine collection."
            action={{
              label: "Add Bottle",
              onClick: handleAddButton,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bottles.map((bottle) => (
              <Card
                key={bottle.id}
                variant="elevated"
                className="card-hover cursor-pointer p-5 rounded-2xl overflow-hidden"
                onClick={() => handleBottleClick(bottle.id)}
              >
                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    {bottle.photoUrl ? (
                      <img
                        src={bottle.photoUrl}
                        alt={bottle.name}
                        className="w-20 h-20 rounded-xl object-cover bg-cream-dark"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-wine-50 flex items-center justify-center border border-wine-200">
                        <Wine className="w-10 h-10 text-wine-800" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-wine-950 truncate">
                      {bottle.name}
                    </h3>

                    {bottle.producer && (
                      <p className="text-sm text-wine-700 truncate mt-0.5">
                        {bottle.producer}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {bottle.vintage && (
                        <Badge variant="secondary" className="text-xs bg-wine-100 text-wine-800 border-0">
                          {bottle.vintage}
                        </Badge>
                      )}
                      {bottle.quantity > 0 && (
                        <Badge variant="secondary" className="text-xs bg-wine-800 text-white border-0">
                          {bottle.quantity} {bottle.quantity === 1 ? 'bottle' : 'bottles'}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {bottle.locationId && locations.length > 0 && (
                        <p className="text-xs text-wine-700 font-medium">
                          {locations.find(l => l.id === bottle.locationId)?.name || ""}
                        </p>
                      )}

                      {bottle.priceAmount && (
                        <p className="text-sm font-semibold text-gold-600">
                          {bottle.priceCurrency || "GBP"} {Number(bottle.priceAmount).toFixed(2)}
                        </p>
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
