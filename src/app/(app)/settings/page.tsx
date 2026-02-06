"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { api } from "@/lib/api-client";

const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "NZD", "ZAR", "CHF", "JPY", "CAD"];

interface Location {
  id: string;
  name: string;
}

interface User {
  email: string;
  currency?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  // Locations state
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingLocationName, setEditingLocationName] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch user
        const userData = await api.get("/auth/me");
        setUser(userData);
        setSelectedCurrency(userData.currency || "USD");

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
      // Try to save to API, fallback to localStorage if not available
      try {
        await api.patch("/auth/me", { currency });
      } catch (err) {
        // API endpoint may not exist, fall back to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("winelog_currency", currency);
        }
      }
    } catch (err) {
      console.error("Failed to update currency:", err);
      setError("Failed to update currency. Please try again.");
    }
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
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader title="Settings" />

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Default Currency Section */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
            Default Currency
          </h2>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#6B7280]">Currency for prices</p>
                <p className="text-lg font-semibold text-[#1A1A1A] mt-1">
                  {selectedCurrency}
                </p>
              </div>

              <select
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="rounded-md border border-[#E5E1DB] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0"
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
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
            Manage Locations
          </h2>

          <div className="space-y-3">
            {locations.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-[#6B7280]">No locations yet</p>
              </Card>
            ) : (
              locations.map((location) => (
                <Card
                  key={location.id}
                  className="p-4 flex items-center justify-between gap-4"
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
                      <p className="font-medium text-[#1A1A1A]">{location.name}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditLocation(location)}
                        disabled={isSaving}
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
            <Card className="p-4 mt-3 flex gap-2">
              <Input
                placeholder="New location name"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="flex-1"
              />
              <Button
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
              className="w-full mt-3 flex items-center justify-center gap-2"
              disabled={isSaving}
            >
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
          )}
        </div>

        {/* Account Section */}
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Account</h2>

          <Card className="p-6 space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Email</p>
              <p className="text-lg font-medium text-[#1A1A1A] mt-1">
                {user?.email || "Loading..."}
              </p>
            </div>

            <div className="pt-4 border-t border-[#E5E1DB]">
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
