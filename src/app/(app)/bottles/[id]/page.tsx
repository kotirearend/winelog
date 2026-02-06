"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Wine,
  Plus,
  Minus,
  MapPin,
  Globe,
  Calendar,
  ChevronDown,
  ChevronUp,
  GlassWater,
  Archive,
  Undo2,
  Star,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  grapes?: string[];
  country?: string;
  region?: string;
  status: string;
  quantity: number;
  locationId?: string;
  subLocationText?: string;
  priceAmount?: string;
  priceCurrency?: string;
  notesShort?: string;
  notesLong?: string;
  tags?: string[];
  purchaseDate?: string;
  purchaseSourceType?: string;
  purchaseSourceName?: string;
  createdAt?: string;
}

interface DrinkLog {
  id: string;
  drankAt: string;
  context?: string;
  venue?: string;
  rating?: number;
  notes?: string;
}

const STATUS_CONFIG = {
  in_cellar: { label: "In Cellar", color: "bg-emerald-100 text-emerald-800", icon: Wine },
  consumed: { label: "Consumed", color: "bg-amber-100 text-amber-800", icon: GlassWater },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-600", icon: Archive },
} as const;

export default function BottleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bottleId = params.id as string;

  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [drinkLogs, setDrinkLogs] = useState<DrinkLog[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDrinkForm, setShowDrinkForm] = useState(false);
  const [showDrinkLogs, setShowDrinkLogs] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editProducer, setEditProducer] = useState("");
  const [editVintage, setEditVintage] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editLocationId, setEditLocationId] = useState("");
  const [editSubLocation, setEditSubLocation] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);

  // Drink log form
  const [drinkVenue, setDrinkVenue] = useState("");
  const [drinkContext, setDrinkContext] = useState("");
  const [drinkRating, setDrinkRating] = useState("");
  const [drinkNotes, setDrinkNotes] = useState("");
  const [isSavingDrink, setIsSavingDrink] = useState(false);

  const fetchBottle = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get(`/bottles/${bottleId}`);
      setBottle(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch bottle:", err);
      setError("Failed to load bottle details.");
    } finally {
      setIsLoading(false);
    }
  }, [bottleId]);

  const fetchDrinkLogs = useCallback(async () => {
    try {
      const data = await api.get(`/bottles/${bottleId}/drinks`);
      setDrinkLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch drink logs:", err);
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
    fetchDrinkLogs();
    fetchLocations();
  }, [fetchBottle, fetchDrinkLogs, fetchLocations]);

  const startEdit = () => {
    if (!bottle) return;
    setEditName(bottle.name);
    setEditProducer(bottle.producer || "");
    setEditVintage(bottle.vintage ? String(bottle.vintage) : "");
    setEditCountry(bottle.country || "");
    setEditRegion(bottle.region || "");
    setEditLocationId(bottle.locationId || "");
    setEditSubLocation(bottle.subLocationText || "");
    setEditQuantity(bottle.quantity);
    setIsEditMode(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    try {
      setIsSaving(true);
      const updateData: Record<string, unknown> = {
        name: editName.trim(),
        producer: editProducer.trim() || undefined,
        vintage: editVintage ? parseInt(editVintage) : undefined,
        country: editCountry.trim() || undefined,
        region: editRegion.trim() || undefined,
        locationId: editLocationId || undefined,
        subLocationText: editSubLocation.trim() || undefined,
        quantity: editQuantity,
      };

      const updated = await api.patch(`/bottles/${bottleId}`, updateData);
      setBottle(updated);
      setIsEditMode(false);
      setError(null);
    } catch (err) {
      console.error("Failed to save:", err);
      setError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updated = await api.patch(`/bottles/${bottleId}/status`, { status: newStatus });
      setBottle(updated);
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("Failed to update status.");
    }
  };

  const handleAddDrink = async () => {
    try {
      setIsSavingDrink(true);
      const data: Record<string, unknown> = {};
      if (drinkVenue.trim()) data.venue = drinkVenue.trim();
      if (drinkContext.trim()) data.context = drinkContext.trim();
      if (drinkRating) data.rating = parseInt(drinkRating);
      if (drinkNotes.trim()) data.notes = drinkNotes.trim();

      await api.post(`/bottles/${bottleId}/drinks`, data);
      setDrinkVenue("");
      setDrinkContext("");
      setDrinkRating("");
      setDrinkNotes("");
      setShowDrinkForm(false);
      fetchDrinkLogs();

      // Auto-set status to consumed if still in cellar
      if (bottle?.status === "in_cellar") {
        handleStatusChange("consumed");
      }
    } catch (err) {
      console.error("Failed to add drink log:", err);
      setError("Failed to save drink log.");
    } finally {
      setIsSavingDrink(false);
    }
  };

  if (isLoading) {
    return <Loading variant="page" />;
  }

  if (!bottle) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <PageHeader title="Wine" showBack variant="wine" />
        <div className="p-4">
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
            {error || "Bottle not found"}
          </div>
        </div>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[bottle.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.in_cellar;
  const locationName = locations.find((l) => l.id === bottle.locationId)?.name;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-28">
      <PageHeader
        title={isEditMode ? "Edit Wine" : bottle.name}
        showBack
        variant="wine"
        action={
          !isEditMode ? (
            <Button variant="outline" onClick={startEdit} className="rounded-xl text-sm">
              Edit
            </Button>
          ) : null
        }
      />

      {error && (
        <div className="mx-4 mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      <div className="p-4 max-w-2xl mx-auto space-y-4">

        {/* ─── Photo ─── */}
        {bottle.photoUrl ? (
          <img
            src={bottle.photoUrl}
            alt={bottle.name}
            className="w-full rounded-2xl border border-[#E5E1DB] object-cover max-h-72"
          />
        ) : (
          <div className="w-full aspect-[3/2] rounded-2xl border-2 border-dashed border-[#E5E1DB] bg-[#F5F1EB] flex items-center justify-center">
            <Wine className="w-14 h-14 text-[#C4B8A8]" />
          </div>
        )}

        {/* ─── Status + Quick Actions ─── */}
        <Card variant="elevated" className="p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", statusConf.color)}>
              <statusConf.icon className="w-3.5 h-3.5" />
              {statusConf.label}
            </span>
            <span className="text-sm text-[#6B7280]">Qty: {bottle.quantity}</span>
          </div>

          <div className="flex gap-2">
            {bottle.status !== "consumed" && (
              <button
                onClick={() => handleStatusChange("consumed")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <GlassWater className="w-3.5 h-3.5" />
                Mark Consumed
              </button>
            )}
            {bottle.status !== "in_cellar" && (
              <button
                onClick={() => handleStatusChange("in_cellar")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Back to Cellar
              </button>
            )}
            {bottle.status !== "archived" && (
              <button
                onClick={() => handleStatusChange("archived")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-50 text-gray-600 text-xs font-semibold border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </button>
            )}
          </div>
        </Card>

        {/* ─── Edit Mode ─── */}
        {isEditMode ? (
          <Card variant="elevated" className="p-5 rounded-2xl space-y-4">
            <Input label="Wine Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <Input label="Wine Maker" value={editProducer} onChange={(e) => setEditProducer(e.target.value)} placeholder="e.g., Château Margaux" />
            <Input label="Vintage" type="number" value={editVintage} onChange={(e) => setEditVintage(e.target.value)} />
            <div className="flex gap-3">
              <div className="flex-1">
                <Input label="Country" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} placeholder="e.g., France" />
              </div>
              <div className="flex-1">
                <Input label="Region" value={editRegion} onChange={(e) => setEditRegion(e.target.value)} placeholder="e.g., Bordeaux" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#7C2D36]" /> Storage Location
              </label>
              <select
                value={editLocationId}
                onChange={(e) => setEditLocationId(e.target.value)}
                className="h-11 rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-2 text-sm text-[#1A1A1A] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20"
              >
                <option value="">No location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {editLocationId && (
              <Input label="Shelf / Bin" value={editSubLocation} onChange={(e) => setEditSubLocation(e.target.value)} />
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1A1A1A]">Quantity</label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="icon" onClick={() => setEditQuantity(Math.max(0, editQuantity - 1))} className="rounded-xl">
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-bold text-[#1A1A1A] min-w-[2rem] text-center">{editQuantity}</span>
                <Button type="button" variant="outline" size="icon" onClick={() => setEditQuantity(editQuantity + 1)} className="rounded-xl">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={isSaving} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button variant="gold" onClick={handleSave} disabled={isSaving} isLoading={isSaving} className="flex-1 rounded-xl">
                Save Changes
              </Button>
            </div>
          </Card>
        ) : (
          /* ─── Details View ─── */
          <Card variant="elevated" className="p-5 rounded-2xl space-y-4">
            {/* Producer + Vintage */}
            {(bottle.producer || bottle.vintage) && (
              <div>
                {bottle.producer && (
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7C2D36]">
                    {bottle.producer}
                  </p>
                )}
                {bottle.vintage && (
                  <span className="inline-block mt-1 text-xs font-medium bg-[#F5F1EB] text-[#6B7280] px-2 py-0.5 rounded-md">
                    {bottle.vintage}
                  </span>
                )}
              </div>
            )}

            {/* Grapes */}
            {bottle.grapes && bottle.grapes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {bottle.grapes.map((g) => (
                  <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-[#7C2D36]/10 text-[#7C2D36] font-medium">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Origin + Storage grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {bottle.country && (
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-[#7C2D36] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[#6B7280] text-xs">Origin</p>
                    <p className="font-medium text-[#1A1A1A]">{bottle.country}{bottle.region ? `, ${bottle.region}` : ""}</p>
                  </div>
                </div>
              )}
              {locationName && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#7C2D36] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[#6B7280] text-xs">Storage</p>
                    <p className="font-medium text-[#1A1A1A]">{locationName}{bottle.subLocationText ? ` — ${bottle.subLocationText}` : ""}</p>
                  </div>
                </div>
              )}
              {bottle.priceAmount && (
                <div className="flex items-start gap-2">
                  <span className="text-[#7C2D36] text-sm font-bold mt-0.5">£</span>
                  <div>
                    <p className="text-[#6B7280] text-xs">Price</p>
                    <p className="font-medium text-[#1A1A1A]">{bottle.priceCurrency || "GBP"} {parseFloat(bottle.priceAmount).toFixed(2)}</p>
                  </div>
                </div>
              )}
              {bottle.purchaseDate && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-[#7C2D36] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[#6B7280] text-xs">Purchased</p>
                    <p className="font-medium text-[#1A1A1A]">{new Date(bottle.purchaseDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              {bottle.purchaseSourceName && (
                <div className="col-span-2">
                  <p className="text-[#6B7280] text-xs">Source</p>
                  <p className="font-medium text-[#1A1A1A]">
                    {bottle.purchaseSourceType && <span className="text-xs bg-[#F5F1EB] px-2 py-0.5 rounded-md mr-2">{bottle.purchaseSourceType}</span>}
                    {bottle.purchaseSourceName}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ─── Drink Log Section ─── */}
        <Card variant="elevated" className="rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowDrinkLogs(!showDrinkLogs)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2">
              <GlassWater className="w-5 h-5 text-[#7C2D36]" />
              <span className="font-semibold text-[#1A1A1A]">Drink Log</span>
              {drinkLogs.length > 0 && (
                <span className="text-xs bg-[#7C2D36]/10 text-[#7C2D36] font-bold px-2 py-0.5 rounded-full">
                  {drinkLogs.length}
                </span>
              )}
            </div>
            {showDrinkLogs ? <ChevronUp className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#6B7280]" />}
          </button>

          {showDrinkLogs && (
            <div className="px-4 pb-4 space-y-3">
              {/* Add Drink button */}
              {!showDrinkForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDrinkForm(true)}
                  className="w-full rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Log a Drink
                </Button>
              ) : (
                <div className="space-y-3 border-2 border-dashed border-[#E5E1DB] rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#1A1A1A]">New Drink Log</p>
                  <Input label="Venue" placeholder="Where did you drink this?" value={drinkVenue} onChange={(e) => setDrinkVenue(e.target.value)} />
                  <Input label="Context" placeholder="e.g., Dinner with friends" value={drinkContext} onChange={(e) => setDrinkContext(e.target.value)} />
                  <Input label="Rating (0-100)" type="number" placeholder="e.g., 85" value={drinkRating} onChange={(e) => setDrinkRating(e.target.value)} min="0" max="100" />
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#1A1A1A]">Notes</label>
                    <textarea
                      value={drinkNotes}
                      onChange={(e) => setDrinkNotes(e.target.value)}
                      placeholder="How was it?"
                      className="h-20 rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setShowDrinkForm(false); setDrinkVenue(""); setDrinkContext(""); setDrinkRating(""); setDrinkNotes(""); }}
                      className="flex-1 rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="gold"
                      onClick={handleAddDrink}
                      disabled={isSavingDrink}
                      isLoading={isSavingDrink}
                      className="flex-1 rounded-xl"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}

              {/* Drink log entries */}
              {drinkLogs.length === 0 ? (
                <p className="text-sm text-[#6B7280] text-center py-4 italic">
                  No drinks logged yet
                </p>
              ) : (
                <div className="space-y-2">
                  {drinkLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 p-3 rounded-xl bg-[#FDFBF7] border border-[#E5E1DB]">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-[#7C2D36]/10 flex items-center justify-center">
                        <GlassWater className="w-4 h-4 text-[#7C2D36]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-[#6B7280]">
                            {new Date(log.drankAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          {log.rating != null && (
                            <span className="flex items-center gap-0.5 text-xs font-bold text-[#D4A847]">
                              <Star className="w-3 h-3 fill-[#D4A847]" />
                              {log.rating}
                            </span>
                          )}
                        </div>
                        {log.venue && <p className="text-sm font-medium text-[#1A1A1A] truncate">{log.venue}</p>}
                        {log.context && <p className="text-xs text-[#6B7280]">{log.context}</p>}
                        {log.notes && <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{log.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ─── Notes ─── */}
        {(bottle.notesShort || bottle.notesLong) && (
          <Card variant="elevated" className="p-5 rounded-2xl space-y-2">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Notes</h3>
            {bottle.notesShort && <p className="text-sm text-[#1A1A1A]">{bottle.notesShort}</p>}
            {bottle.notesLong && <p className="text-sm text-[#6B7280] whitespace-pre-wrap">{bottle.notesLong}</p>}
          </Card>
        )}
      </div>
    </div>
  );
}
