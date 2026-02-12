"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n-context";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Loading } from "@/components/ui/loading";
import { Wine, Beer, MapPin } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from "recharts";
import {
  ComposableMap, Geographies, Geography, Marker, ZoomableGroup,
} from "react-simple-maps";

// ── Types ──────────────────────────────────────────────────────────

interface StatsBottle {
  id: string;
  name: string;
  producer?: string;
  vintage?: number;
  grapes?: string[];
  country?: string;
  region?: string;
  status: string;
  beverageType: string;
  photoUrl?: string;
  priceAmount?: string;
  priceCurrency?: string;
  quantity: number;
  createdAt: string;
}

interface StatsTastingEntry {
  id: string;
  totalScore?: number;
  appearanceScore?: number;
  noseScore?: number;
  palateScore?: number;
  finishScore?: number;
  balanceScore?: number;
}

interface StatsTastingSession {
  id: string;
  name: string;
  tastedAt: string;
}

interface StatsDrinkLog {
  id: string;
  bottleId: string;
  drankAt: string;
  rating?: number;
}

// ── Country Coordinates ────────────────────────────────────────────

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "France": [46.6, 2.3],
  "Italy": [42.5, 12.5],
  "Spain": [40.0, -3.7],
  "Portugal": [39.5, -8.0],
  "Germany": [50.5, 10.5],
  "Austria": [47.5, 14.5],
  "Switzerland": [46.8, 8.2],
  "Greece": [38.5, 23.0],
  "Hungary": [47.0, 19.5],
  "Croatia": [45.0, 15.5],
  "Slovenia": [46.0, 14.8],
  "Romania": [45.9, 24.9],
  "Bulgaria": [42.7, 25.5],
  "Georgia": [42.0, 43.5],
  "Turkey": [39.0, 35.0],
  "Lebanon": [33.9, 35.9],
  "Israel": [31.5, 34.8],
  "Morocco": [32.0, -5.0],
  "Tunisia": [34.0, 9.5],
  "South Africa": [-30.5, 25.0],
  "Australia": [-28.0, 135.0],
  "New Zealand": [-42.0, 173.0],
  "USA": [39.0, -98.0],
  "United States": [39.0, -98.0],
  "Canada": [50.0, -100.0],
  "Argentina": [-34.0, -64.0],
  "Chile": [-33.5, -70.5],
  "Brazil": [-23.5, -46.6],
  "Uruguay": [-34.5, -56.0],
  "Mexico": [23.0, -102.0],
  "China": [39.9, 116.4],
  "Japan": [36.2, 138.3],
  "India": [20.0, 78.0],
  "England": [51.5, -0.8],
  "UK": [51.5, -0.8],
  "United Kingdom": [51.5, -0.8],
  "Czech Republic": [49.8, 15.5],
  "Czechia": [49.8, 15.5],
  "Moldova": [47.0, 28.9],
  "Serbia": [44.0, 21.0],
  "North Macedonia": [41.5, 21.7],
  "Belgium": [50.8, 4.3],
  "Netherlands": [52.1, 5.3],
};

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ── Helpers ────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

// ── Component ──────────────────────────────────────────────────────

export default function StatsPage() {
  const { beverageType, user } = useAuth();
  const { t } = useTranslation();
  const isBeer = beverageType === "beer";

  const [activeTab, setActiveTab] = useState<"dashboard" | "map">("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allBottles, setAllBottles] = useState<StatsBottle[]>([]);
  const [tastingEntries, setTastingEntries] = useState<StatsTastingEntry[]>([]);
  const [tastingSessions, setTastingSessions] = useState<StatsTastingSession[]>([]);
  const [drinkLogs, setDrinkLogs] = useState<StatsDrinkLog[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await api.get("/stats");
        setAllBottles(data.bottles || []);
        setTastingEntries(data.tastingEntries || []);
        setTastingSessions(data.tastingSessions || []);
        setDrinkLogs(data.drinkLogs || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load statistics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ── Computed metrics ──

  const bottles = useMemo(() => allBottles.filter(b => b.beverageType === beverageType), [allBottles, beverageType]);
  const inCellar = useMemo(() => bottles.filter(b => b.status === "in_cellar"), [bottles]);
  const consumed = useMemo(() => bottles.filter(b => b.status === "consumed"), [bottles]);
  const defaultCurrency = user?.defaultCurrency || "GBP";

  const totalInCellar = useMemo(() => inCellar.reduce((s, b) => s + (b.quantity || 0), 0), [inCellar]);
  const totalConsumed = useMemo(() => consumed.reduce((s, b) => s + (b.quantity || 0), 0), [consumed]);

  const collectionValue = useMemo(() => {
    return inCellar.reduce((sum, b) => {
      const price = parseFloat(b.priceAmount || "0");
      return sum + price * (b.quantity || 0);
    }, 0);
  }, [inCellar]);

  const avgScore = useMemo(() => {
    const scores = tastingEntries.filter(e => e.totalScore != null).map(e => e.totalScore!);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [tastingEntries]);

  // ── Chart data ──

  const byCountry = useMemo(() => {
    const counts: Record<string, number> = {};
    bottles.forEach(b => { if (b.country) counts[b.country] = (counts[b.country] || 0) + (b.quantity || 1); });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [bottles]);

  const topGrapes = useMemo(() => {
    const counts: Record<string, number> = {};
    bottles.forEach(b => {
      (b.grapes || []).forEach(g => { counts[g] = (counts[g] || 0) + 1; });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [bottles]);

  const vintageData = useMemo(() => {
    const counts: Record<number, number> = {};
    bottles.forEach(b => { if (b.vintage) counts[b.vintage] = (counts[b.vintage] || 0) + (b.quantity || 1); });
    return Object.entries(counts)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, count]) => ({ year, count }));
  }, [bottles]);

  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: "0-50", count: 0 },
      { range: "51-60", count: 0 },
      { range: "61-70", count: 0 },
      { range: "71-80", count: 0 },
      { range: "81-90", count: 0 },
      { range: "91-100", count: 0 },
    ];
    tastingEntries.forEach(e => {
      if (e.totalScore == null) return;
      const s = e.totalScore;
      if (s <= 50) buckets[0].count++;
      else if (s <= 60) buckets[1].count++;
      else if (s <= 70) buckets[2].count++;
      else if (s <= 80) buckets[3].count++;
      else if (s <= 90) buckets[4].count++;
      else buckets[5].count++;
    });
    return buckets.filter(b => b.count > 0);
  }, [tastingEntries]);

  const monthlyActivity = useMemo(() => {
    const now = new Date();
    const months: { month: string; tastings: number; drinks: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short" });
      months.push({ month: label, tastings: 0, drinks: 0 });

      tastingSessions.forEach(s => {
        const sd = new Date(s.tastedAt);
        const sk = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, "0")}`;
        if (sk === key) months[months.length - 1].tastings++;
      });
      drinkLogs.forEach(dl => {
        const dd = new Date(dl.drankAt);
        const dk = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}`;
        if (dk === key) months[months.length - 1].drinks++;
      });
    }
    return months;
  }, [tastingSessions, drinkLogs]);

  // ── Map data ──

  const bottlesByCountry = useMemo(() => {
    const grouped: Record<string, StatsBottle[]> = {};
    bottles.forEach(b => {
      if (b.country) {
        if (!grouped[b.country]) grouped[b.country] = [];
        grouped[b.country].push(b);
      }
    });
    return grouped;
  }, [bottles]);

  const mapMarkers = useMemo(() => {
    return Object.entries(bottlesByCountry)
      .filter(([country]) => COUNTRY_COORDS[country])
      .map(([country, btls]) => {
        const coords = COUNTRY_COORDS[country];
        const withPhoto = btls.find(b => b.photoUrl);
        const totalQty = btls.reduce((s, b) => s + (b.quantity || 1), 0);
        return {
          country,
          coordinates: [coords[1], coords[0]] as [number, number], // [lng, lat]
          photoUrl: withPhoto?.photoUrl || null,
          count: totalQty,
          bottleCount: btls.length,
        };
      });
  }, [bottlesByCountry]);

  const selectedBottles = selectedCountry ? (bottlesByCountry[selectedCountry] || []) : [];

  // ── Custom tooltip ──

  const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-lg shadow-lg border border-[#E5E1DB] px-3 py-2 text-xs">
        <p className="font-semibold text-[#1A1A1A]">{label}</p>
        <p className="text-[#7C2D36]">{payload[0].value}</p>
      </div>
    );
  };

  // ── Render ──

  const accentColor = isBeer ? "#B45309" : "#7C2D36";

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader title={t("stats.title")} showBack />

      {/* Tab Switcher */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex bg-[#F5F0EB] rounded-xl p-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "dashboard"
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-[#6B7280]"
            }`}
          >
            {t("stats.dashboard")}
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "map"
                ? "bg-white text-[#1A1A1A] shadow-sm"
                : "text-[#6B7280]"
            }`}
          >
            {t("stats.world_map")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loading variant="inline" />
        </div>
      ) : error ? (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">{error}</div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

          {/* ═══════════ DASHBOARD TAB ═══════════ */}
          {activeTab === "dashboard" && (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label={t("stats.total_bottles")} value={totalInCellar} accent={accentColor} />
                <MetricCard label={t("stats.collection_value")} value={formatCurrency(collectionValue, defaultCurrency)} accent={accentColor} />
                <MetricCard label={t("stats.avg_score")} value={avgScore || "—"} accent={accentColor} />
                <MetricCard label={t("stats.consumed")} value={totalConsumed} accent={accentColor} />
              </div>

              {/* Bottles by Country */}
              {byCountry.length > 0 && (
                <ChartCard title={t("stats.by_country")}>
                  <ResponsiveContainer width="100%" height={byCountry.length * 40 + 20}>
                    <BarChart data={byCountry} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} fill={accentColor} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Top Grapes */}
              {topGrapes.length > 0 && (
                <ChartCard title={t("stats.top_grapes")}>
                  <ResponsiveContainer width="100%" height={topGrapes.length * 40 + 20}>
                    <BarChart data={topGrapes} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#D4A847" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Vintage Spread */}
              {vintageData.length > 0 && (
                <ChartCard title={t("stats.vintage_spread")}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={vintageData} margin={{ left: -15, right: 10, top: 5, bottom: 5 }}>
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={accentColor} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Score Distribution */}
              {scoreDistribution.length > 0 && (
                <ChartCard title={t("stats.score_dist")}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={scoreDistribution} margin={{ left: -15, right: 10, top: 5, bottom: 5 }}>
                      <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {scoreDistribution.map((_, i) => (
                          <Cell key={i} fill={i < 3 ? "#E5E1DB" : i < 5 ? "#D4A847" : accentColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Monthly Activity */}
              {monthlyActivity.some(m => m.tastings > 0 || m.drinks > 0) && (
                <ChartCard title={t("stats.monthly_activity")}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyActivity} margin={{ left: -15, right: 10, top: 5, bottom: 5 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="tastings" stroke={accentColor} fill={accentColor} fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="drinks" stroke="#D4A847" fill="#D4A847" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* No data fallback */}
              {bottles.length === 0 && (
                <div className="text-center py-12">
                  {isBeer ? <Beer className="w-12 h-12 text-[#E5E1DB] mx-auto mb-3" /> : <Wine className="w-12 h-12 text-[#E5E1DB] mx-auto mb-3" />}
                  <p className="text-[#6B7280] text-sm">{t("stats.no_data")}</p>
                </div>
              )}
            </>
          )}

          {/* ═══════════ WORLD MAP TAB ═══════════ */}
          {activeTab === "map" && (
            <>
              <div className="bg-white rounded-2xl border border-[#E5E1DB] overflow-hidden">
                <ComposableMap
                  projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
                  style={{ width: "100%", height: "auto" }}
                >
                  <ZoomableGroup>
                    <Geographies geography={GEO_URL}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rpiKey || geo.properties.name}
                            geography={geo}
                            fill="#F5F0EB"
                            stroke="#E5E1DB"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: "none" },
                              hover: { fill: "#EDE8E0", outline: "none" },
                              pressed: { outline: "none" },
                            }}
                          />
                        ))
                      }
                    </Geographies>

                    {mapMarkers.map((marker) => (
                      <Marker
                        key={marker.country}
                        coordinates={marker.coordinates}
                        onClick={() => setSelectedCountry(marker.country === selectedCountry ? null : marker.country)}
                      >
                        {marker.photoUrl ? (
                          <g style={{ cursor: "pointer" }}>
                            <circle r={16} fill="white" stroke={marker.country === selectedCountry ? accentColor : "#E5E1DB"} strokeWidth={marker.country === selectedCountry ? 2.5 : 1.5} />
                            <clipPath id={`clip-${marker.country.replace(/\s/g, "")}`}>
                              <circle r={14} />
                            </clipPath>
                            <image
                              href={marker.photoUrl}
                              x={-14} y={-14}
                              width={28} height={28}
                              clipPath={`url(#clip-${marker.country.replace(/\s/g, "")})`}
                              preserveAspectRatio="xMidYMid slice"
                            />
                            {marker.count > 1 && (
                              <>
                                <circle cx={10} cy={-10} r={8} fill={accentColor} />
                                <text x={10} y={-7} textAnchor="middle" fontSize={8} fontWeight="bold" fill="white">
                                  {marker.count > 99 ? "99+" : marker.count}
                                </text>
                              </>
                            )}
                          </g>
                        ) : (
                          <g style={{ cursor: "pointer" }}>
                            <circle r={14} fill={marker.country === selectedCountry ? accentColor : "#7C2D36"} stroke="white" strokeWidth={2} />
                            <text textAnchor="middle" y={4} fontSize={10} fontWeight="bold" fill="white">
                              {marker.count}
                            </text>
                          </g>
                        )}
                      </Marker>
                    ))}
                  </ZoomableGroup>
                </ComposableMap>
              </div>

              {/* Tap hint */}
              {mapMarkers.length > 0 && !selectedCountry && (
                <p className="text-center text-xs text-[#6B7280] flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {t("stats.tap_pin")}
                </p>
              )}

              {/* No countries on map */}
              {mapMarkers.length === 0 && (
                <div className="text-center py-8">
                  <MapPin className="w-10 h-10 text-[#E5E1DB] mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280]">{t("stats.no_data")}</p>
                </div>
              )}

              {/* Selected country detail */}
              {selectedCountry && selectedBottles.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E5E1DB] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E1DB] bg-[#F5F0EB]">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">
                      {t("stats.bottles_from", { country: selectedCountry })} ({selectedBottles.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-[#E5E1DB]">
                    {selectedBottles.map((bottle) => (
                      <Link key={bottle.id} href={`/bottles/${bottle.id}`}>
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#FDFBF7] transition-colors active:scale-[0.99]">
                          {bottle.photoUrl ? (
                            <img src={bottle.photoUrl} alt={bottle.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7C2D36] to-[#D4A847] flex items-center justify-center flex-shrink-0">
                              {isBeer ? <Beer className="w-5 h-5 text-white" /> : <Wine className="w-5 h-5 text-white" />}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1A1A1A] truncate">{bottle.name}</p>
                            <p className="text-xs text-[#6B7280] truncate">
                              {[bottle.producer, bottle.vintage, bottle.region].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          {bottle.quantity > 1 && (
                            <span className="text-xs font-medium text-[#6B7280]">×{bottle.quantity}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function MetricCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E1DB] p-4 text-center">
      <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
      <div className="text-xs text-[#6B7280] mt-1">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E1DB] p-4">
      <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">{title}</h3>
      {children}
    </div>
  );
}
