"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, GlassWater, Globe, Loader2, MapPin, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhotoCapture, ScanResult } from "@/components/ui/photo-capture";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n-context";
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
  "Alsace", "Languedoc", "Languedoc-Roussillon", "Provence", "Beaujolais",
  "Chablis", "Jura", "Savoie", "Corsica", "Sud-Ouest",
  "Saint-Émilion", "Pauillac", "Margaux", "Médoc", "Haut-Médoc", "Graves",
  "Pessac-Léognan", "Pomerol", "Sauternes", "Entre-Deux-Mers",
  "Côtes du Rhône", "Châteauneuf-du-Pape", "Hermitage", "Côte-Rôtie",
  "Crozes-Hermitage", "Condrieu", "Gigondas", "Vacqueyras",
  "Sancerre", "Pouilly-Fumé", "Vouvray", "Muscadet", "Chinon", "Anjou",
  "Côte de Nuits", "Côte de Beaune", "Côte Chalonnaise", "Mâconnais",
  "Meursault", "Puligny-Montrachet", "Gevrey-Chambertin", "Nuits-Saint-Georges",
  "Pommard", "Volnay", "Corton", "Clos de Vougeot",
  // Italy
  "Tuscany", "Piedmont", "Veneto", "Sicily", "Puglia", "Sardinia",
  "Lombardy", "Trentino-Alto Adige", "Friuli Venezia Giulia", "Umbria",
  "Abruzzo", "Campania", "Calabria", "Basilicata", "Marche", "Emilia-Romagna",
  "Chianti", "Chianti Classico", "Barolo", "Barbaresco", "Brunello di Montalcino",
  "Valpolicella", "Amarone", "Prosecco", "Soave", "Amalfi Coast",
  "Bolgheri", "Montalcino", "Montepulciano", "Etna", "Franciacorta",
  "Gavi", "Asti", "Langhe", "Roero", "Taurasi",
  // Spain
  "Rioja", "Ribera del Duero", "Priorat", "Rías Baixas",
  "Penedès", "Navarra", "La Mancha", "Jerez", "Rueda",
  "Toro", "Jumilla", "Cava", "Galicia", "Bierzo",
  "Valdepeñas", "Somontano", "Montsant", "Empordà", "Txakoli",
  // Portugal
  "Douro Valley", "Alentejo", "Dão", "Vinho Verde", "Madeira",
  "Bairrada", "Lisboa", "Setúbal", "Tejo", "Azores",
  // Germany
  "Mosel", "Rheingau", "Pfalz", "Baden", "Rheinhessen",
  "Nahe", "Franken", "Württemberg", "Ahr", "Sachsen",
  // Austria
  "Wachau", "Kamptal", "Kremstal", "Burgenland", "Steiermark",
  "Weinviertel", "Thermenregion", "Neusiedlersee",
  // Australia
  "Barossa Valley", "McLaren Vale", "Hunter Valley", "Yarra Valley",
  "Margaret River", "Coonawarra", "Clare Valley", "Adelaide Hills",
  "Eden Valley", "Mornington Peninsula", "Rutherglen", "Tasmania",
  "Mudgee", "Riverina", "Langhorne Creek", "Heathcote",
  // New Zealand
  "Marlborough", "Central Otago", "Hawke's Bay", "Martinborough",
  "Gisborne", "Waiheke Island", "Canterbury", "Nelson", "Wairarapa",
  // South Africa
  "Stellenbosch", "Franschhoek", "Swartland", "Constantia", "Paarl",
  "Elgin", "Walker Bay", "Hemel-en-Aarde", "Robertson", "Tulbagh",
  "Elim", "Darling", "Breedekloof",
  // USA
  "Napa Valley", "Sonoma", "Willamette Valley", "Paso Robles",
  "Santa Barbara", "Columbia Valley", "Finger Lakes",
  "Russian River Valley", "Anderson Valley", "Walla Walla",
  "Dry Creek Valley", "Alexander Valley", "Carneros",
  "Santa Cruz Mountains", "Lodi", "Temecula Valley",
  "Lake County", "Livermore Valley", "Red Mountain",
  // South America — Argentina
  "Mendoza", "Uco Valley", "Luján de Cuyo", "Salta", "Cafayate",
  "San Juan", "Patagonia",
  // South America — Chile
  "Maipo Valley", "Colchagua Valley", "Casablanca Valley",
  "Rapel Valley", "Aconcagua Valley", "Leyda Valley", "Bío Bío Valley",
  "Maule Valley", "Itata Valley", "Limarí Valley",
  // South America — Brazil & Uruguay
  "Serra Gaúcha", "Vale dos Vinhedos", "Canelones",
  // Canada
  "Niagara Peninsula", "Okanagan Valley", "Prince Edward County",
  "Similkameen Valley", "Nova Scotia",
  // England & Wales
  "Sussex", "Kent", "Hampshire", "Surrey", "Essex", "Cornwall",
  // Eastern Europe
  "Tokaj", "Eger", "Villány", "Szekszárd",
  "Moravia", "Bohemia",
  "Podravje", "Posavje",
  "Istria", "Dalmatia", "Slavonia",
  "Dealu Mare", "Moldovan Hills", "Transylvania",
  "Thracian Valley",
  // Greece
  "Santorini", "Nemea", "Naoussa", "Crete", "Macedonia", "Peloponnese",
  "Amyndeon", "Mantinia",
  // Middle East & Caucasus
  "Bekaa Valley", "Kakheti", "Kartli",
  // North Africa
  "Atlas Mountains",
  // Asia
  "Ningxia", "Yantai", "Nashik", "Koshu",
  // Other
  "Swartberg", "Limoux", "Bandol", "Cahors", "Irouléguy", "Fitou",
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
  const { t } = useTranslation();
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

  // Consuming now state
  const [consumingNow, setConsumingNow] = useState(false);
  const [drinkContext, setDrinkContext] = useState("");
  const [drinkVenue, setDrinkVenue] = useState("");
  const [drinkRating, setDrinkRating] = useState("");
  const [drinkNotes, setDrinkNotes] = useState("");
  const [tastingMode, setTastingMode] = useState<"quick" | "full">("quick");

  // Full tasting spectrum state (1-5 scale each)
  const [spectrumValues, setSpectrumValues] = useState<Record<string, number>>({});

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
      newErrors.name = t(`bottles.name_required_${beverageType}`);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [photoUploadFailed, setPhotoUploadFailed] = useState(false);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const result = await api.uploadFile("/uploads", file);
      return result.photoUrl;
    } catch (err) {
      console.error("Photo upload failed:", err);
      setPhotoUploadFailed(true);
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

      // If consuming now, set status to consumed and quantity to 1
      if (consumingNow) {
        bottleData.status = "consumed";
      }

      const response = await api.post("/bottles", bottleData);

      if (response && response.id) {
        // Create drink log if consuming now
        if (consumingNow) {
          try {
            const drinkData: Record<string, unknown> = {
              drankAt: new Date().toISOString(),
            };
            if (drinkContext) drinkData.context = drinkContext;
            if (drinkVenue.trim()) drinkData.venue = drinkVenue.trim();
            if (drinkRating) drinkData.rating = parseInt(drinkRating);
            if (drinkNotes.trim()) drinkData.notes = drinkNotes.trim();
            if (tastingMode === "full" && Object.keys(spectrumValues).length > 0) {
              drinkData.tastingNotes = spectrumValues;
            }

            await api.post(`/bottles/${response.id}/drinks`, drinkData);
          } catch (err) {
            console.error("Failed to create drink log:", err);
            // Don't block — the bottle was saved successfully
          }
        }

        if (photoUploadFailed) {
          router.push("/bottles?photoSkipped=1");
        } else {
          router.push("/bottles");
        }
      }
    } catch (err) {
      console.error("Failed to save bottle:", err);
      setErrors({ submit: t("bottles.save_failed") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-40 sm:pb-0">
      <PageHeader title={t(`bottles.new_title_${beverageType}`)} showBack variant="wine" />

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

        {/* Scanning banner — shows while OCR is running */}
        {isScanning && (
          <div className="flex items-center gap-3 rounded-xl bg-[#7C2D36]/10 border border-[#7C2D36]/20 px-4 py-3 animate-pulse">
            <Loader2 className="w-4 h-4 text-[#7C2D36] animate-spin" />
            <span className="text-sm font-medium text-[#7C2D36]">
              {t("scan.scanning_form")}
            </span>
          </div>
        )}

        {/* Wine Maker */}
        <div>
          <Input
            ref={producerInputRef}
            label={t(`bottles.producer_${beverageType}`)}
            placeholder={t(`bottles.producer_placeholder_${beverageType}`)}
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
            autoFocus
          />
        </div>

        {/* Vintage — wine only */}
        {!isBeer && (
          <div>
            <Input
              label={t("bottles.vintage")}
              type="number"
              placeholder={t("bottles.vintage_placeholder")}
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
            label={t(`bottles.name_${beverageType}`)}
            placeholder={t(`bottles.name_placeholder_${beverageType}`)}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />
        </div>

        {/* Grapes - Tag Chips */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1A1A1A]">
            {t(isBeer ? "bottles.grapes_beer" : "bottles.grapes")}
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
              placeholder={grapes.length > 0 ? t(`bottles.add_grape_${beverageType}`) : t(`bottles.grape_placeholder_${beverageType}`)}
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
              {t("bottles.country")}
            </label>
            <input
              type="text"
              placeholder={t("bottles.country_placeholder")}
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
              {t("bottles.region_label")}
            </label>
            <div className="relative">
              <input
                ref={regionInputRef}
                type="text"
                placeholder={t("bottles.region_placeholder")}
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
            {t("bottles.notes")}
          </label>
          <textarea
            placeholder={t(`bottles.notes_placeholder_${beverageType}`)}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            className="min-h-20 w-full rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20 resize-none"
          />
          {notes.length > 0 && (
            <p className="text-xs text-[#6B7280] text-right">{notes.length}/500</p>
          )}
        </div>

        {/* Consuming Now Toggle */}
        <button
          type="button"
          onClick={() => setConsumingNow(!consumingNow)}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-4 rounded-2xl border-2 transition-all duration-200",
            consumingNow
              ? isBeer
                ? "border-[#B45309] bg-[#B45309]/10"
                : "border-[#7C2D36] bg-[#7C2D36]/10"
              : "border-[#E5E1DB] bg-white hover:border-[#7C2D36]/30"
          )}
        >
          <GlassWater className={cn(
            "w-5 h-5",
            consumingNow
              ? isBeer ? "text-[#B45309]" : "text-[#7C2D36]"
              : "text-[#6B7280]"
          )} />
          <div className="flex-1 text-left">
            <p className={cn(
              "text-sm font-semibold",
              consumingNow ? "text-[#1A1A1A]" : "text-[#6B7280]"
            )}>
              {t("bottles.consuming_now")}
            </p>
            <p className="text-xs text-[#6B7280]">{t("bottles.consuming_now_desc")}</p>
          </div>
          <div className={cn(
            "w-10 h-6 rounded-full transition-all duration-200 flex items-center px-0.5",
            consumingNow
              ? isBeer ? "bg-[#B45309]" : "bg-[#7C2D36]"
              : "bg-[#D1D5DB]"
          )}>
            <div className={cn(
              "w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
              consumingNow ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        </button>

        {/* Consuming Now Details */}
        {consumingNow && (
          <Card variant="outlined" className="p-5 rounded-2xl space-y-4 border-2 border-dashed">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1A1A1A]">
                {t("bottles.drink_context")}
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "casual", label: t("bottles.context_casual") },
                  { key: "dinner", label: t("bottles.context_dinner") },
                  { key: "celebration", label: t("bottles.context_celebration") },
                  { key: "tasting", label: t("bottles.context_tasting") },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDrinkContext(drinkContext === key ? "" : key)}
                    className={cn(
                      "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                      drinkContext === key
                        ? isBeer
                          ? "bg-[#B45309] text-white shadow-md"
                          : "bg-[#7C2D36] text-white shadow-md"
                        : "bg-white border-2 border-[#E5E1DB] text-[#1A1A1A] hover:border-[#7C2D36]/30"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label={t("bottles.drink_venue")}
              placeholder={t("bottles.drink_venue_placeholder")}
              value={drinkVenue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDrinkVenue(e.target.value)}
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1A1A1A]">
                {t("bottles.drink_rating")}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={drinkRating || 50}
                  onChange={(e) => setDrinkRating(e.target.value)}
                  className="flex-1 accent-[#7C2D36]"
                />
                <span className="text-sm font-bold text-[#1A1A1A] w-10 text-right">
                  {drinkRating || "—"}
                </span>
              </div>
            </div>

            {/* Quick / Full Tasting Toggle */}
            <div className="flex gap-1 bg-[#F5F1EB] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTastingMode("quick")}
                className={cn(
                  "flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all duration-200",
                  tastingMode === "quick"
                    ? "bg-white text-[#7C2D36] shadow-sm"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                )}
              >
                {t("bottles.tasting_quick")}
              </button>
              <button
                type="button"
                onClick={() => setTastingMode("full")}
                className={cn(
                  "flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all duration-200",
                  tastingMode === "full"
                    ? "bg-white text-[#7C2D36] shadow-sm"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                )}
              >
                {t("bottles.tasting_full")}
              </button>
            </div>

            {tastingMode === "quick" ? (
              /* Quick: just text notes */
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  {t("bottles.drink_notes")}
                </label>
                <textarea
                  placeholder={t("bottles.drink_notes_placeholder")}
                  value={drinkNotes}
                  onChange={(e) => setDrinkNotes(e.target.value)}
                  maxLength={500}
                  className="min-h-16 w-full rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20 resize-none"
                />
              </div>
            ) : (
              /* Full: spectrum sliders + text notes */
              <div className="space-y-3">
                {(isBeer
                  ? [
                      { key: "bitterness", label: t("bottles.spectrum_bitterness"), low: t("bottles.spectrum_low"), high: t("bottles.spectrum_high") },
                      { key: "carbonation", label: t("bottles.spectrum_carbonation"), low: t("bottles.spectrum_flat"), high: t("bottles.spectrum_fizzy") },
                      { key: "body", label: t("bottles.spectrum_body"), low: t("bottles.spectrum_light"), high: t("bottles.spectrum_full") },
                      { key: "balance", label: t("bottles.spectrum_balance"), low: t("bottles.spectrum_poor"), high: t("bottles.spectrum_excellent") },
                      { key: "drinkability", label: t("bottles.spectrum_drinkability"), low: t("bottles.spectrum_low"), high: t("bottles.spectrum_high") },
                    ]
                  : [
                      { key: "sweetness", label: t("bottles.spectrum_sweetness"), low: t("bottles.spectrum_low"), high: t("bottles.spectrum_high") },
                      { key: "acidity", label: t("bottles.spectrum_acidity"), low: t("bottles.spectrum_low"), high: t("bottles.spectrum_high") },
                      { key: "tannin", label: t("bottles.spectrum_tannin"), low: t("bottles.spectrum_low"), high: t("bottles.spectrum_high") },
                      { key: "body", label: t("bottles.spectrum_body"), low: t("bottles.spectrum_light"), high: t("bottles.spectrum_full") },
                      { key: "finish", label: t("bottles.spectrum_finish"), low: t("bottles.spectrum_short"), high: t("bottles.spectrum_long") },
                    ]
                ).map(({ key, label, low, high }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[#1A1A1A]">{label}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#6B7280] w-10 text-right">{low}</span>
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSpectrumValues((prev) => ({ ...prev, [key]: val }))}
                            className={cn(
                              "flex-1 h-8 rounded-lg text-xs font-bold transition-all duration-200",
                              spectrumValues[key] === val
                                ? isBeer
                                  ? "bg-[#B45309] text-white shadow-md"
                                  : "bg-[#7C2D36] text-white shadow-md"
                                : spectrumValues[key] && spectrumValues[key] >= val
                                  ? isBeer
                                    ? "bg-[#B45309]/20 text-[#B45309]"
                                    : "bg-[#7C2D36]/20 text-[#7C2D36]"
                                  : "bg-[#F5F1EB] text-[#6B7280] hover:bg-[#E5E1DB]"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-[#6B7280] w-10">{high}</span>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col gap-2 pt-2">
                  <label className="text-sm font-semibold text-[#1A1A1A]">
                    {t("bottles.drink_notes")}
                  </label>
                  <textarea
                    placeholder={t("bottles.drink_notes_placeholder")}
                    value={drinkNotes}
                    onChange={(e) => setDrinkNotes(e.target.value)}
                    maxLength={500}
                    className="min-h-16 w-full rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20 resize-none"
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Storage Location */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#7C2D36]" />
            {t("bottles.storage_location")}
          </label>

          {!showAddLocation ? (
            <div className="flex gap-2">
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="flex-1 h-11 rounded-xl border-2 border-[#E5E1DB] bg-white px-4 py-2 text-sm text-[#1A1A1A] transition-all focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36]/20"
              >
                <option value="">{t("bottles.no_location")}</option>
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
                {t("common.add")}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder={t("bottles.new_location")}
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
                {t("common.cancel")}
              </Button>
            </div>
          )}
        </div>

        {/* Sub-location */}
        {selectedLocationId && (
          <div>
            <Input
              label={t("bottles.shelf_bin")}
              placeholder={t("bottles.shelf_placeholder")}
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
          {showMoreDetails ? t("bottles.hide_purchase_details") : t("bottles.add_purchase_details")}
        </button>

        {/* Expandable Details */}
        {showMoreDetails && (
          <Card variant="outlined" className="p-5 rounded-2xl space-y-5">
            <Input
              label={t("bottles.purchase_date")}
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1A1A1A]">
                {t("bottles.purchase_source")}
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "Restaurant", label: t("bottles.source_restaurant") },
                  { key: "Shop", label: t("bottles.source_shop") },
                  { key: "Other", label: t("bottles.source_other") },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPurchaseSource(key)}
                    className={cn(
                      "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                      purchaseSource === key
                        ? "bg-[#7C2D36] text-white shadow-md shadow-[#7C2D36]/20"
                        : "bg-white border-2 border-[#E5E1DB] text-[#1A1A1A] hover:border-[#7C2D36]/30 hover:bg-[#FDF2F4]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label={t("bottles.source_name")}
              placeholder={t("bottles.source_name_placeholder")}
              value={purchaseSourceName}
              onChange={(e) => setPurchaseSourceName(e.target.value)}
            />

            <div className="flex gap-4">
              <Input
                label={t("bottles.price")}
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
                  {t("bottles.currency")}
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
              label={t("bottles.quantity")}
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
            disabled={isLoading || isScanning}
            isLoading={isLoading}
            variant="gold"
            className="w-full rounded-xl"
            size="lg"
          >
            {isScanning ? t("scan.wait_scanning") : t(`bottles.save_${beverageType}`)}
          </Button>
        </div>
      </form>
    </div>
  );
}
