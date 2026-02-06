"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Check, X, LogOut, Wine, Beer } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { useAuth, BeverageType } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "NZD", "ZAR", "CHF", "JPY", "CAD"];

interface Location {
  id: string;
  name: string;
}

interface UserData {
  email: string;
  defaultCurrency?: string;
  beverageType?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { beverageType, setBeverageType } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState("GBP");

  // Locations state
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingLocationName, setEditingLocationName] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const isBeer = beverageType === "beer";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch user
        const data = await api.get("/auth/me");
        setUserData(data);
        setSelectedCurrency(data.defaultCurrency || "GBP");

        // Fetch locations
        const locationsData = await api.get("/locations");
        setLocations(Array.isArray(locationsData) ? locationsData : locationsData.data || []);

        setError(null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load settings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCurrencyChange = async (currency: string) => {
    try {
      setSelectedCurrency(currency);
      try {
        await api.patch("/auth/me", { currency });
      } catch (err) {
        if (typeof window !== "undefined") {
          localStorage.setItem("winelog_currency", currency);
        }
      }
    } catch (err) {
      console.error("Failed to update currency:", err);
      setError("Failed to update currency. Please try again.");
    }
  };

  const handleBeverageChange = (type: BeverageType) => {
    setBeverageType(type);
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      const newLocation = await api.post("/locations", { name: newLocationName.trim() });
      setLocations((prev) => [...prev, newLocation]);
      setNewLocationName("");
      setIsAddingLocation(false);
      setError(null);
    } catch (err) {
      console.error("Failed to add location:", err);
      setError("Failed to add location. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocationId(location.id);
    setEditingLocationName(location.name);
  };

  const handleSaveLocation = async () => {
    if (!editingLocationName.trim() || !editingLocationId) {
      return;
    }

    try {
      setIsSaving(true);
      const updated = await api.patch(`/locations/${editingLocationId}`, {
        name: editingLocationName.trim(),
      });

      setLocations((prev) =>
        prev.map((l) => (l.id === editingLocationId ? updated : l))
      );

      setEditingLocationId(null);
      setEditingLocationName("");
      setError(null);
    } catch (err) {
      console.error("Failed to update location:", err);
      setError("Failed to update location. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingLocationId(null);
    setEditingLocationName("");
  };

  const handleSignOut = () => {
    api.clearToken();
    router.push("/login");
  };

  if (isLoading) {
    return <Loading variant="page" />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader title="Settings" />

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-8 pb-28">
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Beverage Type Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-1 rounded-full bg-gold-500"></div>
            <h2 className="text-lg font-semibold text-wine-950">Beverage Type</h2>
          </div>

          <Card variant="elevated" className="p-6 rounded-2xl">
            <p className="text-sm text-wine-700 font-medium mb-4">
              Choose your beverage — this changes the tasting categories, form labels, and scoring system throughout the app.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleBeverageChange("wine")}
                className={cn(
                  "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200",
                  !isBeer
                    ? "border-[#7C2D36] bg-[#7C2D36] text-white shadow-lg shadow-[#7C2D36]/20"
                    : "border-[#E5E1DB] bg-white text-[#1A1A1A] hover:border-[#7C2D36]/40 hover:bg-[#FDF2F4]"
                )}
              >
                <Wine className="w-8 h-8" />
                <span className="text-sm font-bold">Wine</span>
                <span className={cn(
                  "text-[10px]",
                  !isBeer ? "text-white/70" : "text-[#6B7280]"
                )}>
                  WSET Tasting
                </span>
              </button>
              <button
                onClick={() => handleBeverageChange("beer")}
                className={cn(
                  "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200",
                  isBeer
                    ? "border-[#B45309] bg-[#B45309] text-white shadow-lg shadow-[#B45309]/20"
                    : "border-[#E5E1DB] bg-white text-[#1A1A1A] hover:border-[#B45309]/40 hover:bg-[#FFFBEB]"
                )}
              >
                <Beer className="w-8 h-8" />
                <span className="text-sm font-bold">Beer</span>
                <span className={cn(
                  "text-[10px]",
                  isBeer ? "text-white/70" : "text-[#6B7280]"
                )}>
                  BJCP Scoring
                </span>
              </button>
            </div>
          </Card>
        </div>

        {/* Account Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-1 rounded-full bg-gold-500"></div>
            <h2 className="text-lg font-semibold text-wine-950">Account</h2>
          </div>

          <Card variant="elevated" className="p-6 rounded-2xl">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-wine-700 font-medium">Email Address</p>
                <p className="text-base font-semibold text-wine-950 mt-2">
                  {userData?.email || "Loading..."}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Default Currency Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-1 rounded-full bg-gold-500"></div>
            <h2 className="text-lg font-semibold text-wine-950">Default Currency</h2>
          </div>

          <Card variant="elevated" className="p-6 rounded-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-wine-700 font-medium">Currency for prices</p>
                <p className="text-base font-semibold text-wine-950 mt-1">
                  {selectedCurrency}
                </p>
              </div>

              <select
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="rounded-xl border-2 border-warm-border bg-cream px-4 py-2.5 text-sm font-semibold text-wine-950 transition-all duration-200 focus:outline-none focus:border-wine-800 focus:ring-2 focus:ring-wine-800/20 hover:border-wine-200"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        </div>

        {/* Manage Locations Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-1 rounded-full bg-gold-500"></div>
            <h2 className="text-lg font-semibold text-wine-950">
              {isBeer ? "Beer Storage Locations" : "Wine Storage Locations"}
            </h2>
          </div>

          <div className="space-y-3">
            {locations.length === 0 ? (
              <Card variant="outlined" className="p-8 text-center rounded-2xl border-2 border-dashed border-warm-border">
                <p className="text-sm text-wine-700 font-medium">No storage locations yet</p>
              </Card>
            ) : (
              locations.map((location) => (
                <Card
                  key={location.id}
                  variant="outlined"
                  className="p-4 flex items-center justify-between gap-4 rounded-2xl border-2 border-warm-border hover:border-wine-200 transition-colors duration-200"
                >
                  {editingLocationId === location.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Location name"
                        value={editingLocationName}
                        onChange={(e) => setEditingLocationName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="gold"
                        onClick={handleSaveLocation}
                        disabled={isSaving || !editingLocationName.trim()}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-wine-950">{location.name}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditLocation(location)}
                        disabled={isSaving}
                        className="text-wine-800 hover:text-wine-950 hover:bg-wine-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </Card>
              ))
            )}
          </div>

          {isAddingLocation ? (
            <Card variant="outlined" className="p-4 mt-3 flex gap-2 rounded-2xl border-2 border-wine-200 bg-wine-50/50">
              <Input
                placeholder="New location name"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="gold"
                onClick={handleAddLocation}
                disabled={isSaving || !newLocationName.trim()}
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingLocation(false);
                  setNewLocationName("");
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </Card>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsAddingLocation(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-warm-border text-wine-800 hover:bg-wine-50"
              disabled={isSaving}
            >
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
          )}
        </div>

        {/* Sign Out Section */}
        <div className="pt-6 border-t border-warm-border">
          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
