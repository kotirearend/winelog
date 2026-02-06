"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Wine, Plus, Minus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  locationId?: string;
  subLocation?: string;
  price?: number;
  currency?: string;
  notes?: string;
  longNotes?: string;
  tags?: string;
  purchaseDate?: string;
  purchaseSourceType?: string;
  purchaseSourceName?: string;
}

interface BottleWithLocation extends Bottle {
  location?: Location;
}

export default function BottleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bottleId = params.id as string;

  const [bottle, setBottle] = useState<BottleWithLocation | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state for editing
  const [editData, setEditData] = useState<BottleWithLocation | null>(null);

  const fetchBottle = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get(`/bottles/${bottleId}`);
      setBottle(data);
      setEditData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch bottle:", err);
      setError("Failed to load bottle details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [bottleId]);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await api.get("/locations");
      setLocations(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    }
  }, []);

  useEffect(() => {
    fetchBottle();
    fetchLocations();
  }, [fetchBottle, fetchLocations]);

  const handleEditChange = (field: keyof BottleWithLocation, value: any) => {
    if (editData) {
      setEditData({
        ...editData,
        [field]: value,
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editData?.name.trim()) {
      newErrors.name = "Bottle name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !editData) {
      return;
    }

    try {
      setIsSaving(true);

      const updateData = {
        name: editData.name,
        producer: editData.producer || undefined,
        vintage: editData.vintage || undefined,
        quantity: editData.quantity,
        locationId: editData.locationId || undefined,
        subLocation: editData.subLocation || undefined,
        price: editData.price || undefined,
        currency: editData.currency || undefined,
        notes: editData.notes || undefined,
        longNotes: editData.longNotes || undefined,
        tags: editData.tags || undefined,
        purchaseDate: editData.purchaseDate || undefined,
        purchaseSourceType: editData.purchaseSourceType || undefined,
        purchaseSourceName: editData.purchaseSourceName || undefined,
      };

      await api.patch(`/bottles/${bottleId}`, updateData);

      setBottle(editData);
      setIsEditMode(false);
      setError(null);
    } catch (err) {
      console.error("Failed to save bottle:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(bottle);
    setIsEditMode(false);
    setErrors({});
  };

  const handleQuantityChange = (delta: number) => {
    if (editData) {
      const newQuantity = Math.max(1, editData.quantity + delta);
      handleEditChange("quantity", newQuantity);
    }
  };

  if (isLoading) {
    return <Loading variant="page" />;
  }

  if (!bottle) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <PageHeader title="Bottle" showBack />
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Bottle not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      <PageHeader
        title={bottle.name}
        showBack
        action={
          !isEditMode ? (
            <Button
              variant="outline"
              onClick={() => {
                setIsEditMode(true);
                setEditData(bottle);
              }}
            >
              Edit
            </Button>
          ) : null
        }
      />

      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 sm:mx-6">
          {error}
        </div>
      )}

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        {/* Photo Section */}
        <div>
          {bottle.photoUrl ? (
            <img
              src={bottle.photoUrl}
              alt={bottle.name}
              className="w-full rounded-lg border border-[#E5E1DB] object-cover max-h-96"
            />
          ) : (
            <div className="w-full aspect-video rounded-lg border border-[#E5E1DB] bg-[#F5F1EB] flex items-center justify-center">
              <Wine className="w-16 h-16 text-[#6B7280]" />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="space-y-4 border-t border-[#E5E1DB] pt-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Details</h2>

          {isEditMode && editData ? (
            <div className="space-y-4">
              <Input
                label="Name"
                value={editData.name}
                onChange={(e) => handleEditChange("name", e.target.value)}
                error={errors.name}
                required
              />

              <Input
                label="Producer"
                value={editData.producer || ""}
                onChange={(e) => handleEditChange("producer", e.target.value)}
              />

              <Input
                label="Vintage"
                type="number"
                value={editData.vintage || ""}
                onChange={(e) =>
                  handleEditChange("vintage", e.target.value ? parseInt(e.target.value) : undefined)
                }
                min="1900"
                max={new Date().getFullYear()}
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">
                  Location
                </label>
                <select
                  value={editData.locationId || ""}
                  onChange={(e) => handleEditChange("locationId", e.target.value || undefined)}
                  className="h-10 rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0"
                >
                  <option value="">Select a location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Sub-Location"
                value={editData.subLocation || ""}
                onChange={(e) => handleEditChange("subLocation", e.target.value)}
                placeholder="e.g., Shelf 3, Bottom right"
              />

              {/* Quantity with +/- buttons */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={editData.quantity}
                    onChange={(e) =>
                      handleEditChange("quantity", Math.max(1, parseInt(e.target.value) || 1))
                    }
                    min="1"
                    className="flex-1 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Input
                  label="Price"
                  type="number"
                  value={editData.price || ""}
                  onChange={(e) =>
                    handleEditChange("price", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  step="0.01"
                  min="0"
                  className="flex-1"
                />

                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Currency
                  </label>
                  <select
                    value={editData.currency || "USD"}
                    onChange={(e) => handleEditChange("currency", e.target.value)}
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
                label="Purchase Date"
                type="date"
                value={editData.purchaseDate || ""}
                onChange={(e) => handleEditChange("purchaseDate", e.target.value || undefined)}
              />

              <Input
                label="Purchase Source Type"
                value={editData.purchaseSourceType || ""}
                onChange={(e) => handleEditChange("purchaseSourceType", e.target.value)}
                placeholder="e.g., Restaurant, Shop"
              />

              <Input
                label="Purchase Source Name"
                value={editData.purchaseSourceName || ""}
                onChange={(e) => handleEditChange("purchaseSourceName", e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {bottle.producer && (
                <div>
                  <p className="text-[#6B7280]">Producer</p>
                  <p className="font-medium text-[#1A1A1A]">{bottle.producer}</p>
                </div>
              )}

              {bottle.vintage && (
                <div>
                  <p className="text-[#6B7280]">Vintage</p>
                  <p className="font-medium text-[#1A1A1A]">{bottle.vintage}</p>
                </div>
              )}

              {bottle.location && (
                <div>
                  <p className="text-[#6B7280]">Location</p>
                  <p className="font-medium text-[#1A1A1A]">{bottle.location.name}</p>
                </div>
              )}

              {bottle.subLocation && (
                <div>
                  <p className="text-[#6B7280]">Sub-Location</p>
                  <p className="font-medium text-[#1A1A1A]">{bottle.subLocation}</p>
                </div>
              )}

              <div>
                <p className="text-[#6B7280]">Quantity</p>
                <p className="font-medium text-[#1A1A1A]">{bottle.quantity}</p>
              </div>

              {bottle.price && (
                <div>
                  <p className="text-[#6B7280]">Price</p>
                  <p className="font-medium text-[#1A1A1A]">
                    {bottle.currency || "USD"} {bottle.price.toFixed(2)}
                  </p>
                </div>
              )}

              {bottle.purchaseDate && (
                <div>
                  <p className="text-[#6B7280]">Purchase Date</p>
                  <p className="font-medium text-[#1A1A1A]">
                    {new Date(bottle.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {bottle.purchaseSourceType && (
                <div>
                  <p className="text-[#6B7280]">Purchase Type</p>
                  <p className="font-medium text-[#1A1A1A]">{bottle.purchaseSourceType}</p>
                </div>
              )}

              {bottle.purchaseSourceName && (
                <div>
                  <p className="text-[#6B7280]">Purchase Source</p>
                  <p className="font-medium text-[#1A1A1A]">{bottle.purchaseSourceName}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-4 border-t border-[#E5E1DB] pt-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Notes</h2>

          {isEditMode && editData ? (
            <div className="space-y-4">
              <Input
                label="Notes"
                value={editData.notes || ""}
                onChange={(e) => handleEditChange("notes", e.target.value)}
                placeholder="Quick tasting notes"
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">
                  Detailed Notes
                </label>
                <textarea
                  value={editData.longNotes || ""}
                  onChange={(e) => handleEditChange("longNotes", e.target.value)}
                  placeholder="Detailed tasting notes, observations, etc."
                  className="h-32 rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0 resize-none"
                />
              </div>

              <Input
                label="Tags"
                value={editData.tags || ""}
                onChange={(e) => handleEditChange("tags", e.target.value)}
                placeholder="Comma-separated tags (e.g., fruity, dry, bold)"
              />
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              {bottle.notes && (
                <div>
                  <p className="text-[#6B7280] mb-1">Notes</p>
                  <p className="text-[#1A1A1A] whitespace-pre-wrap">{bottle.notes}</p>
                </div>
              )}

              {bottle.longNotes && (
                <div>
                  <p className="text-[#6B7280] mb-1">Detailed Notes</p>
                  <p className="text-[#1A1A1A] whitespace-pre-wrap">{bottle.longNotes}</p>
                </div>
              )}

              {bottle.tags && (
                <div>
                  <p className="text-[#6B7280] mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {bottle.tags.split(",").map((tag) => (
                      <span
                        key={tag.trim()}
                        className="inline-flex items-center rounded-full bg-[#E5E1DB] px-3 py-1 text-xs font-medium text-[#1A1A1A]"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!bottle.notes && !bottle.longNotes && !bottle.tags && (
                <p className="text-[#6B7280] italic">No notes yet</p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isEditMode && (
          <div className="flex gap-3 border-t border-[#E5E1DB] pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              isLoading={isSaving}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
