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
  location?: Location;
  price?: number;
  currency?: string;
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
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader
        title="My Cellar"
        action={
          <Button
            size="icon"
            onClick={handleAddButton}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <SearchInput
          placeholder="Search by name or producer..."
          onChangeDebounced={setSearch}
        />

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => handleFilterChange(null)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C2D36] focus-visible:ring-offset-2",
              selectedLocationId === null
                ? "bg-[#7C2D36] text-white"
                : "bg-[#F5F1EB] text-[#1A1A1A] hover:bg-[#EBE5DB]"
            )}
          >
            All
          </button>

          {locations.map((location) => (
            <button
              key={location.id}
              onClick={() => handleFilterChange(location.id)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C2D36] focus-visible:ring-offset-2 flex-shrink-0",
                selectedLocationId === location.id
                  ? "bg-[#7C2D36] text-white"
                  : "bg-[#F5F1EB] text-[#1A1A1A] hover:bg-[#EBE5DB]"
              )}
            >
              {location.name}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {bottles.length === 0 ? (
          <EmptyState
            icon={<Wine className="w-12 h-12" />}
            title="No bottles in your cellar yet"
            description="Add your first bottle to get started tracking your collection."
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
                className="cursor-pointer transition-all hover:shadow-md active:shadow-sm p-4"
                onClick={() => handleBottleClick(bottle.id)}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {bottle.photoUrl ? (
                      <img
                        src={bottle.photoUrl}
                        alt={bottle.name}
                        className="w-16 h-16 rounded object-cover bg-[#F5F1EB]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-[#F5F1EB] flex items-center justify-center">
                        <Wine className="w-8 h-8 text-[#6B7280]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1A1A1A] truncate">
                      {bottle.name}
                    </h3>

                    {bottle.producer && (
                      <p className="text-sm text-[#6B7280] truncate">
                        {bottle.producer}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">
                      {bottle.vintage && (
                        <Badge variant="secondary" className="text-xs">
                          {bottle.vintage}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 space-y-1">
                      {bottle.location && (
                        <p className="text-xs text-[#6B7280]">
                          {bottle.location.name}
                        </p>
                      )}

                      <p className="text-sm font-medium text-[#1A1A1A]">
                        Qty: {bottle.quantity}
                      </p>

                      {bottle.price && (
                        <p className="text-sm text-[#6B7280]">
                          {bottle.currency || "USD"}{" "}
                          {bottle.price.toFixed(2)}
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
