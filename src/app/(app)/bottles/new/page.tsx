"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, MapPin, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhotoCapture } from "@/components/ui/photo-capture";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
}

const PURCHASE_SOURCES = ["Restaurant", "Shop", "Other"];

export default function AddBottlePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [newLocationName, setNewLocationName] = useState("");
  const [vintage, setVintage] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseSource, setPurchaseSource] = useState<string>("");
  const [purchaseSourceName, setPurchaseSourceName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [subLocation, setSubLocation] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nameInputRef = useRef<HTMLInputElement>(null);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await api.get("/locations");
      const locationsList = Array.isArray(data) ? data : data.data || [];
      setLocations(locationsList);

      const lastLocationId = localStorage.getItem("lastUsedLocationId");
      if (lastLocationId && locationsList.some((l: Location) => l.id === lastLocationId)) {
        setSelectedLocationId(lastLocationId);
      } else if (locationsList.length > 0) {
        setSelectedLocationId(locationsList[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    }
  }, []);

  const fetchUserSettings = useCallback(async () => {
    try {
      const data = await api.get("/user");
      if (data.defaultCurrency) {
        setDefaultCurrency(data.defaultCurrency);
        setCurrency(data.defaultCurrency);
      }
    } catch (err) {
      console.error("Failed to fetch user settings:", err);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    fetchUserSettings();
  }, [fetchLocations, fetchUserSettings]);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Bottle name is required";
    }

    if (!selectedLocationId && !newLocationName.trim()) {
      newErrors.location = "Please select or add a location";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const result = await api.uploadFile("/uploads", file);
      return result.photoUrl;
    } catch (err) {
      console.error("Photo upload failed:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      let photoUrl: string | null = null;
      if (selectedFile) {
        photoUrl = await uploadPhoto(selectedFile);
      }

      let finalLocationId = selectedLocationId;

      if (!selectedLocationId && newLocationName.trim()) {
        const newLocation = await api.post("/locations", {
          name: newLocationName.trim(),
        });
        finalLocationId = newLocation.id;
      }

      if (finalLocationId) {
        localStorage.setItem("lastUsedLocationId", finalLocationId);
      }

      const bottleData: Record<string, unknown> = {
        name: name.trim(),
        locationId: finalLocationId,
        quantity: parseInt(quantity) || 1,
      };

      if (photoUrl) bottleData.photoUrl = photoUrl;
      if (vintage) bottleData.vintage = parseInt(vintage);
      if (purchaseDate) bottleData.purchaseDate = purchaseDate;
      if (purchaseSource) bottleData.purchaseSourceType = purchaseSource.toUpperCase();
      if (purchaseSourceName) bottleData.purchaseSourceName = purchaseSourceName;
      if (price) bottleData.priceAmount = parseFloat(price);
      if (currency) bottleData.priceCurrency = currency;
      if (subLocation) bottleData.subLocationText = subLocation;

      const response = await api.post("/bottles", bottleData);

      if (response && response.id) {
        router.push("/bottles");
      }
    } catch (err) {
      console.error("Failed to save bottle:", err);
      setErrors({ submit: "Failed to save bottle. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-28 sm:pb-0">
      <PageHeader title="Add Bottle" showBack variant="wine" />

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        {/* Photo Capture */}
        <Card variant="elevated" className="p-6 rounded-2xl">
          <PhotoCapture
            onPhotoSelected={setSelectedFile}
            className=""
          />
        </Card>

        {/* Name */}
        <div>
          <Input
            ref={nameInputRef}
            label="Bottle Name"
            placeholder="e.g., Cabernet Sauvignon Reserve"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
            autoFocus
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#7C2D36]" />
            Location
          </label>

          {!showAddLocation ? (
            <div className="flex gap-2">
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="flex-1 h-11 rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-2 text-sm text-[#1A1A1A] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20"
              >
                <option value="">Select a location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddLocation(true)}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="New location name"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="flex-1"
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddLocation(false);
                  setNewLocationName("");
                }}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          )}

          {errors.location && (
            <p className="text-xs text-red-600 mt-1">{errors.location}</p>
          )}
        </div>

        {/* More Details Toggle */}
        <button
          type="button"
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold text-[#7C2D36] rounded-xl border-2 border-dashed border-[#E5E1DB] hover:border-[#7C2D36]/30 hover:bg-[#FDF2F4] transition-all"
        >
          {showMoreDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {showMoreDetails ? "Hide Details" : "Add More Details"}
        </button>

        {/* Expandable Details */}
        {showMoreDetails && (
          <Card variant="outlined" className="p-5 rounded-2xl space-y-5">
            <Input
              label="Vintage"
              type="number"
              placeholder="e.g., 2018"
              value={vintage}
              onChange={(e) => setVintage(e.target.value)}
              min="1900"
              max={new Date().getFullYear()}
            />

            <Input
              label="Purchase Date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1A1A1A]">
                Purchase Source
              </label>
              <div className="flex gap-2 flex-wrap">
                {PURCHASE_SOURCES.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setPurchaseSource(source)}
                    className={cn(
                      "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                      purchaseSource === source
                        ? "bg-[#7C2D36] text-white shadow-md shadow-[#7C2D36]/20"
                        : "bg-white border-2 border-[#E5E1DB] text-[#1A1A1A] hover:border-[#7C2D36]/30 hover:bg-[#FDF2F4]"
                    )}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Source Name"
              placeholder="e.g., Restaurant name or store"
              value={purchaseSourceName}
              onChange={(e) => setPurchaseSourceName(e.target.value)}
            />

            <div className="flex gap-4">
              <Input
                label="Price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0"
                className="flex-1"
              />

              <div className="flex flex-col gap-2 flex-1">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-11 rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-2 text-sm text-[#1A1A1A] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="NZD">NZD</option>
                  <option value="ZAR">ZAR</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            </div>

            <Input
              label="Sub-Location"
              placeholder="e.g., Shelf 3, Bottom right"
              value={subLocation}
              onChange={(e) => setSubLocation(e.target.value)}
            />

            <Input
              label="Quantity"
              type="number"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </Card>
        )}

        {errors.submit && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
            {errors.submit}
          </div>
        )}

        {/* Save Button - Fixed on Mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-[#E5E1DB] sm:static sm:border-t-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none z-40">
          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
            variant="gold"
            className="w-full rounded-xl"
            size="lg"
          >
            Save to Cellar
          </Button>
        </div>
      </form>
    </div>
  );
}
