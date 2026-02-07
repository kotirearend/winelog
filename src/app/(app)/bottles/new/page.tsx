"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Globe, MapPin, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhotoCapture, ScanResult } from "@/components/ui/photo-capture";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const PURCHASE_SOURCES = ["Restaurant", "Shop", "Other"];

const COMMON_GRAPES = [
  "Cabernet Sauvignon", "Merlot", "Pinot Noir", "Syrah", "Shiraz",
  "Grenache", "Tempranillo", "Sangiovese", "Nebbiolo", "Malbec",
  "Zinfandel", "Mourvèdre", "Gamay", "Barbera", "Carmenère",
  "Chardonnay", "Sauvignon Blanc", "Riesling", "Pinot Grigio",
  "Gewürztraminer", "Viognier", "Chenin Blanc", "Sémillon",
  "Muscat", "Albariño", "Grüner Veltliner", "Verdejo",
  "Trebbiano", "Garganega", "Torrontés",
];

const COMMON_REGIONS = [
  // France
  "Bordeaux", "Burgundy", "Champagne", "Rhône Valley", "Loire Valley",
  "Alsace", "Languedoc", "Provence", "Beaujolais", "Chablis",
  "Saint-Émilion", "Pauillac", "Margaux", "Médoc", "Graves",
  "Côtes du Rhône", "Châteauneuf-du-Pape", "Sancerre", "Pouilly-Fumé",
  // Italy
  "Tuscany", "Piedmont", "Veneto", "Sicily", "Puglia",
  "Chianti", "Barolo", "Barbaresco", "Brunello di Montalcino",
  "Valpolicella", "Prosecco", "Soave", "Amalfi Coast",
  // Spain
  "Rioja", "Ribera del Duero", "Priorat", "Rías Baixas",
  "Penedès", "Navarra", "La Mancha", "Jerez",
  // Portugal
  "Douro Valley", "Alentejo", "Dão", "Vinho Verde", "Madeira",
  // Germany & Austria
  "Mosel", "Rheingau", "Pfalz", "Baden", "Wachau", "Kamptal",
  // New World — Australia
  "Barossa Valley", "McLaren Vale", "Hunter Valley", "Yarra Valley",
  "Margaret River", "Coonawarra", "Clare Valley", "Adelaide Hills",
  // New World — New Zealand
  "Marlborough", "Central Otago", "Hawke's Bay", "Martinborough",
  // New World — South Africa
  "Stellenbosch", "Franschhoek", "Swartland", "Constantia", "Paarl",
  // New World — USA
  "Napa Valley", "Sonoma", "Willamette Valley", "Paso Robles",
  "Santa Barbara", "Columbia Valley", "Finger Lakes",
  // New World — South America
  "Mendoza", "Maipo Valley", "Colchagua Valley", "Casablanca Valley",
  // Other
  "Santorini", "Tokaj", "Niagara Peninsula",
];

const COMMON_BEER_STYLES = [
  "IPA", "DIPA", "NEIPA", "Pale Ale", "APA", "Lager", "Pilsner",
  "Stout", "Imperial Stout", "Porter", "Wheat Beer", "Hefeweizen",
  "Witbier", "Saison", "Belgian Blonde", "Belgian Dubbel", "Belgian Tripel",
  "Sour", "Gose", "Berliner Weisse", "Lambic", "Gueuze",
  "Amber Ale", "Red Ale", "Brown Ale", "Scottish Ale", "ESB",
  "Barleywine", "Bock", "Doppelbock", "Märzen", "Kölsch",
  "Cream Ale", "Mild", "Bitter", "Golden Ale",
];

export default function AddBottlePage() {
  const router = useRouter();
  const { beverageType } = useAuth();
  const isBeer = beverageType === "beer";
  const [isLoading, setIsLoading] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState("GBP");
  const [isScanning, setIsScanning] = useState(false);

  // Form state — core fields
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [producer, setProducer] = useState("");
  const [vintage, setVintage] = useState("");
  const [name, setName] = useState("");
  const [grapes, setGrapes] = useState<string[]>([]);
  const [grapeInput, setGrapeInput] = useState("");
  const [showGrapeSuggestions, setShowGrapeSuggestions] = useState(false);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [showRegionSuggestions, setShowRegionSuggestions] = useState(false);

  // Storage location state
  interface Location { id: string; name: string; }
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [subLocation, setSubLocation] = useState("");

  // Form state — more details
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchaseSource, setPurchaseSource] = useState<string>("");
  const [purchaseSourceName, setPurchaseSourceName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const producerInputRef = useRef<HTMLInputElement>(null);
  const grapeInputRef = useRef<HTMLInputElement>(null);
  const regionInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill from scan results — only fills empty fields
  const handleScanResult = useCallback((data: ScanResult) => {
    if (data.name && !name.trim()) setName(data.name);
    if (data.producer && !producer.trim()) setProducer(data.producer);
    if (data.vintage && !vintage) setVintage(String(data.vintage));
    if (data.country && !country.trim()) setCountry(data.country);
    if (data.region && !region.trim()) setRegion(data.region);
    if (data.grapes && data.grapes.length > 0 && grapes.length === 0) {
      setGrapes(data.grapes);
    }
  }, [name, producer, vintage, country, region, grapes]);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await api.get("/locations");
      const list = Array.isArray(data) ? data : data.data || [];
      setLocations(list);
      const lastId = localStorage.getItem("lastUsedLocationId");
      if (lastId && list.some((l: Location) => l.id === lastId)) {
        setSelectedLocationId(lastId);
      } else if (list.length > 0) {
        setSelectedLocationId(list[0].id);
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
    producerInputRef.current?.focus();
  }, []);

  // Grape/style suggestions filtered by input
  const suggestionList = isBeer ? COMMON_BEER_STYLES : COMMON_GRAPES;
  const filteredGrapes = grapeInput.trim()
    ? suggestionList.filter(
        (g) =>
          g.toLowerCase().includes(grapeInput.toLowerCase()) &&
          !grapes.includes(g)
      ).slice(0, 6)
    : [];

  // Region suggestions filtered by input
  const filteredRegions = region.trim()
    ? COMMON_REGIONS.filter(
        (r) => r.toLowerCase().includes(region.toLowerCase())
      ).slice(0, 6)
    : [];

  const addGrape = (grape: string) => {
    const trimmed = grape.trim();
    if (trimmed && !grapes.includes(trimmed)) {
      setGrapes([...grapes, trimmed]);
    }
    setGrapeInput("");
    setShowGrapeSuggestions(false);
    grapeInputRef.current?.focus();
  };

  const removeGrape = (grape: string) => {
    setGrapes(grapes.filter((g) => g !== grape));
  };

  const handleGrapeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredGrapes.length > 0) {
        addGrape(filteredGrapes[0]);
      } else if (grapeInput.trim()) {
        addGrape(grapeInput);
      }
    } else if (e.key === "Backspace" && !grapeInput && grapes.length > 0) {
      removeGrape(grapes[grapes.length - 1]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = isBeer ? "Beer name is required" : "Wine name is required";
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

      // Handle new location creation if needed
      let finalLocationId = selectedLocationId;
      if (!selectedLocationId && newLocationName.trim()) {
        const newLoc = await api.post("/locations", { name: newLocationName.trim() });
        finalLocationId = newLoc.id;
      }
      if (finalLocationId) {
        localStorage.setItem("lastUsedLocationId", finalLocationId);
      }

      const bottleData: Record<string, unknown> = {
        name: name.trim(),
        quantity: parseInt(quantity) || 1,
        beverageType,
      };

      if (producer.trim()) bottleData.producer = producer.trim();
      if (photoUrl) bottleData.photoUrl = photoUrl;
      if (vintage) bottleData.vintage = parseInt(vintage);
      if (grapes.length > 0) bottleData.grapes = grapes;
      if (country.trim()) bottleData.country = country.trim();
      if (region.trim()) bottleData.region = region.trim();
      if (finalLocationId) bottleData.locationId = finalLocationId;
      if (subLocation.trim()) bottleData.subLocationText = subLocation.trim();
      if (purchaseDate) bottleData.purchaseDate = purchaseDate;
      if (purchaseSource) bottleData.purchaseSourceType = purchaseSource.toUpperCase();
      if (purchaseSourceName) bottleData.purchaseSourceName = purchaseSourceName;
      if (price) bottleData.priceAmount = parseFloat(price);
      if (currency) bottleData.priceCurrency = currency;
      if (notes.trim()) bottleData.notesShort = notes.trim();

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
    <div className="min-h-screen bg-[#FDFBF7] pb-40 sm:pb-0">
      <PageHeader title={isBeer ? "Add Beer" : "Add Wine"} showBack variant="wine" />

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        {/* Photo Capture */}
        <Card variant="elevated" className="p-6 rounded-2xl">
          <PhotoCapture
            onPhotoSelected={setSelectedFile}
            enableScan={true}
            onScanResult={handleScanResult}
            onScanStateChange={setIsScanning}
            className=""
          />
        </Card>

        {/* Wine Maker */}
        <div>
          <Input
            ref={producerInputRef}
            label={isBeer ? "Brewery" : "Wine Maker"}
            placeholder={isBeer ? "e.g., BrewDog" : "e.g., Château Margaux"}
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
            autoFocus
          />
        </div>

        {/* Vintage — wine only */}
        {!isBeer && (
          <div>
            <Input
              label="Vintage"
              type="number"
              placeholder="e.g., 2018"
              value={vintage}
              onChange={(e) => setVintage(e.target.value)}
              min="1900"
              max={new Date().getFullYear()}
            />
          </div>
        )}

        {/* Wine Name */}
        <div>
          <Input
            label={isBeer ? "Beer Name" : "Wine Name"}
            placeholder={isBeer ? "e.g., Punk IPA" : "e.g., Grand Vin"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />
        </div>

        {/* Grapes - Tag Chips */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1A1A1A]">
            {isBeer ? "Style" : "Grapes"}
          </label>

          {/* Selected grape chips */}
          <div className="flex flex-wrap gap-2 min-h-[1rem]">
            {grapes.map((grape) => (
              <span
                key={grape}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium",
                  isBeer ? "bg-[#B45309]" : "bg-[#7C2D36]"
                )}
              >
                {grape}
                <button
                  type="button"
                  onClick={() => removeGrape(grape)}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Grape input with autocomplete */}
          <div className="relative">
            <input
              ref={grapeInputRef}
              type="text"
              placeholder={grapes.length > 0 ? (isBeer ? "Add another style..." : "Add another grape...") : (isBeer ? "e.g., IPA" : "e.g., Cabernet Sauvignon")}
              value={grapeInput}
              onChange={(e) => {
                setGrapeInput(e.target.value);
                setShowGrapeSuggestions(true);
              }}
              onFocus={() => setShowGrapeSuggestions(true)}
              onBlur={() => setTimeout(() => setShowGrapeSuggestions(false), 200)}
              onKeyDown={handleGrapeKeyDown}
              className="w-full h-11 rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20"
            />

            {/* Suggestions dropdown */}
            {showGrapeSuggestions && filteredGrapes.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border-2 border-[#E5E1DB] shadow-lg overflow-hidden">
                {filteredGrapes.map((grape) => (
                  <button
                    key={grape}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addGrape(grape)}
                    className="w-full text-left px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#FDF2F4] hover:text-[#7C2D36] transition-colors border-b border-[#E5E1DB] last:border-b-0"
                  >
                    {grape}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Country of Origin — wine only */}
        {!isBeer && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#7C2D36]" />
              Country of Origin
            </label>
            <input
              type="text"
              placeholder="e.g., France"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="h-11 rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20"
            />
          </div>
        )}

        {/* Region — wine only, with autocomplete */}
        {!isBeer && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#1A1A1A]">
              Region
            </label>
            <div className="relative">
              <input
                ref={regionInputRef}
                type="text"
                placeholder="e.g., Bordeaux, Barossa Valley"
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setShowRegionSuggestions(true);
                }}
                onFocus={() => setShowRegionSuggestions(true)}
                onBlur={() => setTimeout(() => setShowRegionSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredRegions.length > 0) {
                    e.preventDefault();
                    setRegion(filteredRegions[0]);
                    setShowRegionSuggestions(false);
                  }
                }}
                className="w-full h-11 rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20"
              />

              {showRegionSuggestions && filteredRegions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border-2 border-[#E5E1DB] shadow-lg overflow-hidden">
                  {filteredRegions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setRegion(r);
                        setShowRegionSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#FDF2F4] hover:text-[#7C2D36] transition-colors border-b border-[#E5E1DB] last:border-b-0"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1A1A1A]">
            Notes
          </label>
          <textarea
            placeholder={isBeer ? "e.g., Got this from the craft beer shop, limited edition..." : "e.g., Recommended by sommelier, pairs well with lamb..."}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            className="min-h-20 w-full rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20 resize-none"
          />
          {notes.length > 0 && (
            <p className="text-xs text-[#6B7280] text-right">{notes.length}/500</p>
          )}
        </div>

        {/* Storage Location */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#7C2D36]" />
            Storage Location
          </label>

          {!showAddLocation ? (
            <div className="flex gap-2">
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="flex-1 h-11 rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-2 text-sm text-[#1A1A1A] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20"
              >
                <option value="">No location</option>
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
                onClick={() => { setShowAddLocation(false); setNewLocationName(""); }}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Sub-location */}
        {selectedLocationId && (
          <div>
            <Input
              label="Shelf / Bin"
              placeholder="e.g., Shelf 3, Bottom right"
              value={subLocation}
              onChange={(e) => setSubLocation(e.target.value)}
            />
          </div>
        )}

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
          {showMoreDetails ? "Hide Purchase Details" : "Add Purchase Details"}
        </button>

        {/* Expandable Details */}
        {showMoreDetails && (
          <Card variant="outlined" className="p-5 rounded-2xl space-y-5">
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
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="NZD">NZD</option>
                  <option value="ZAR">ZAR</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            </div>

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
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-[#E5E1DB] sm:static sm:bottom-auto sm:border-t-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none z-50">
          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
            variant="gold"
            className="w-full rounded-xl"
            size="lg"
          >
            {isBeer ? "Save to Collection" : "Save to Cellar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
