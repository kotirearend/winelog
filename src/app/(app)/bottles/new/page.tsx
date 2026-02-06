"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

      // Set default location from localStorage
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
    // Focus name input on mount
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
      // Get signed URL
      const signResponse = await api.post("/uploads/sign", {
        filename: file.name,
        contentType: file.type,
      });

      const signedUrl = signResponse.signedUrl || signResponse.url;
      if (!signedUrl) {
        throw new Error("No signed URL returned");
      }

      // Upload directly to storage
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      // Return public URL
      return signResponse.publicUrl || signedUrl.split("?")[0];
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

      // Create location if needed
      if (!selectedLocationId && newLocationName.trim()) {
        const newLocation = await api.post("/locations", {
          name: newLocationName.trim(),
        });
        finalLocationId = newLocation.id;
      }

      // Save location preference
      if (finalLocationId) {
        localStorage.setItem("lastUsedLocationId", finalLocationId);
      }

      // Create bottle
      const bottleData = {
        name: name.trim(),
        producer: undefined,
        vintage: vintage ? parseInt(vintage) : undefined,
        photoUrl: photoUrl || undefined,
        quantity: parseInt(quantity) || 1,
        locationId: finalLocationId,
        price: price ? parseFloat(price) : undefined,
        currency: currency || "USD",
        subLocation: subLocation || undefined,
        purchaseDate: purchaseDate || undefined,
        purchaseSourceType: purchaseSource || undefined,
        purchaseSourceName: purchaseSourceName || undefined,
      };

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
    <div className="min-h-screen bg-[#FDFBF7] pb-24 sm:pb-0">
      <PageHeader title="Add Bottle" showBack />

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        {/* Photo Capture */}
        <div>
          <PhotoCapture
            onPhotoSelected={setSelectedFile}
            className="mb-4"
          />
        </div>

        {/* Name - Required, auto-focus */}
        <Input
          ref={nameInputRef}
          label="Bottle Name"
          placeholder="e.g., Cabernet Sauvignon"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          autoFocus
        />

        {/* Location Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#1A1A1A]">Location</label>

          {!showAddLocation ? (
            <div className="flex gap-2">
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="flex-1 h-10 rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0"
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
              >
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
              >
                Cancel
              </Button>
            </div>
          )}

          {errors.location && (
            <p className="text-xs text-red-600">{errors.location}</p>
          )}
        </div>

        {/* More Details Toggle */}
        <button
          type="button"
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#7C2D36] hover:text-[#9B3A44] transition-colors"
        >
          {showMoreDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          More Details
        </button>

        {/* Expandable More Details Section */}
        {showMoreDetails && (
          <div className="space-y-4 p-4 bg-[#F5F1EB] rounded-lg">
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
              <label className="text-sm font-medium text-[#1A1A1A]">
                Purchase Source Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {PURCHASE_SOURCES.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setPurchaseSource(source)}
                    className={cn(
                      "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      purchaseSource === source
                        ? "bg-[#7C2D36] text-white"
                        : "bg-white border border-[#E5E1DB] text-[#1A1A1A] hover:bg-[#FDFBF7]"
                    )}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Purchase Source Name"
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
                <label className="text-sm font-medium text-[#1A1A1A]">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-10 rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
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
          </div>
        )}

        {errors.submit && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {errors.submit}
          </div>
        )}

        {/* Save Button - Fixed on Mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E5E1DB] sm:static sm:border-t-0 sm:bg-transparent sm:p-0">
          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            Save Bottle
          </Button>
        </div>
      </form>
    </div>
  );
}
