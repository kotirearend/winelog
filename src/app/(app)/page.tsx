"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { Plus, Wine, Beer, ClipboardList, ChevronRight, Users, ArrowRight } from "lucide-react";
import { WinelogLogo } from "@/components/ui/winelog-logo";

interface Bottle {
  id: string;
  name: string;
  producer?: string;
  vintage?: number;
  country?: string;
  region?: string;
  grapes?: string[];
  status?: string;
  photoUrl?: string;
  quantity: number;
  priceAmount?: string;
  priceCurrency?: string;
}

interface Tasting {
  id: string;
  name: string;
  tastedAt: string;
  venue?: string;
  notes?: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user, beverageType } = useAuth();
  const isBeer = beverageType === "beer";
  const [allBottles, setAllBottles] = useState<Bottle[]>([]);
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [bottlesLoading, setBottlesLoading] = useState(true);
  const [tastingsLoading, setTastingsLoading] = useState(true);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const fetchBottles = async () => {
      try {
        setBottlesLoading(true);
        const data = await api.get(`/bottles?beverageType=${beverageType}`);
        const list = Array.isArray(data) ? data : data.data || [];
        setAllBottles(list);
      } catch (error) {
        console.error("Failed to fetch bottles:", error);
      } finally {
        setBottlesLoading(false);
      }
    };
    fetchBottles();
  }, [beverageType]);

  useEffect(() => {
    const fetchTastings = async () => {
      try {
        setTastingsLoading(true);
        const data = await api.get("/tastings");
        const list = Array.isArray(data) ? data : data.data || [];
        setTastings(list);
      } catch (error) {
        console.error("Failed to fetch tastings:", error);
      } finally {
        setTastingsLoading(false);
      }
    };
    fetchTastings();
  }, []);

  // Compute stats from full list
  const inCellarBottles = allBottles.filter((b) => (b.status || "in_cellar") === "in_cellar");
  const totalBottlesInStock = inCellarBottles.reduce((sum, b) => sum + (b.quantity || 0), 0);
  const recentBottles = allBottles.slice(0, 5);
  const recentTastings = tastings.slice(0, 5);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#7C2D36] via-[#5C1F28] to-[#3A0F18] text-white px-4 pt-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Logo + Greeting */}
          <div className="flex items-center gap-3 mb-6">
            <WinelogLogo size="sm" variant="icon" color="cream" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Hey, {user?.name?.split(" ")[0]}
              </h1>
              <p className="text-white/50 text-xs mt-0.5">{isBeer ? "Your beer collection at a glance" : "Your wine collection at a glance"}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white">
                {bottlesLoading ? "—" : totalBottlesInStock}
              </div>
              <div className="text-white/60 text-xs mt-0.5">{isBeer ? "Beers in Collection" : "Bottles in Cellar"}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-white">
                {tastingsLoading ? "—" : tastings.length}
              </div>
              <div className="text-white/60 text-xs mt-0.5">Tasting Sessions</div>
            </div>
          </div>

          {/* Quick Add */}
          <Link href="/bottles/new" className="block">
            <Button variant="gold" className="w-full h-12 text-base font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg">
              <Plus className="w-5 h-5" />
              {isBeer ? "Quick Add Beer" : "Quick Add Bottle"}
            </Button>
          </Link>

          {/* Join Tasting */}
          {!showJoinInput ? (
            <button
              onClick={() => setShowJoinInput(true)}
              className="w-full mt-3 h-10 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
            >
              <Users className="w-4 h-4" />
              Join a Tasting Session
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))}
                placeholder="Enter code"
                maxLength={6}
                autoFocus
                className="flex-1 h-10 rounded-xl bg-white/15 border border-white/30 text-white placeholder:text-white/40 px-4 text-center font-mono text-lg tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#D4A847]/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCode.length >= 4) {
                    router.push(`/join/${joinCode}`);
                  }
                  if (e.key === "Escape") {
                    setShowJoinInput(false);
                    setJoinCode("");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (joinCode.length >= 4) router.push(`/join/${joinCode}`);
                }}
                disabled={joinCode.length < 4}
                className="h-10 px-4 rounded-xl bg-[#22C55E] text-white font-medium text-sm flex items-center gap-1 disabled:opacity-40 transition-opacity"
              >
                <ArrowRight className="w-4 h-4" />
                Join
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-8">

        {/* Recent Bottles */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              {isBeer ? <Beer className="w-5 h-5 text-[#B45309]" /> : <Wine className="w-5 h-5 text-[#7C2D36]" />}
              {isBeer ? "Recent Beers" : "Recent Bottles"}
            </h2>
            <Link href="/bottles" className="text-[#D4A847] text-sm font-semibold">
              View all
            </Link>
          </div>

          {bottlesLoading ? (
            <Loading />
          ) : recentBottles.length === 0 ? (
            <EmptyState
              icon={isBeer ? <Beer className="w-10 h-10" /> : <Wine className="w-10 h-10" />}
              title={isBeer ? "No beers yet" : "No bottles yet"}
              description={isBeer ? "Add your first beer to start tracking" : "Add your first bottle to start tracking"}
              action={{ label: isBeer ? "Add Beer" : "Add Bottle", onClick: () => (window.location.href = "/bottles/new") }}
            />
          ) : (
            <div className="space-y-2">
              {recentBottles.map((bottle) => (
                <Link key={bottle.id} href={`/bottles/${bottle.id}`}>
                  <Card
                    variant="elevated"
                    className="rounded-2xl overflow-hidden hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex">
                      {/* Photo or accent */}
                      {bottle.photoUrl ? (
                        <img
                          src={bottle.photoUrl}
                          alt={bottle.name}
                          className="w-16 h-auto object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-1.5 flex-shrink-0 bg-gradient-to-b from-[#7C2D36] to-[#D4A847]" />
                      )}

                      <div className="flex-1 min-w-0 p-3.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          {bottle.producer && (
                            <p className="text-[10px] font-bold text-[#7C2D36] uppercase tracking-widest truncate">
                              {bottle.producer}
                            </p>
                          )}
                          <h3 className="font-semibold text-sm text-[#1A1A1A] truncate">
                            {bottle.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {bottle.vintage && (
                              <span className="text-xs font-medium text-[#7C2D36]">{bottle.vintage}</span>
                            )}
                            {bottle.country && (
                              <span className="text-xs text-[#6B7280]">
                                {bottle.country}{bottle.region ? ` · ${bottle.region}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#C4B8A8] flex-shrink-0" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Tastings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#7C2D36]" />
              Recent Tastings
            </h2>
            <Link href="/tastings" className="text-[#D4A847] text-sm font-semibold">
              View all
            </Link>
          </div>

          {tastingsLoading ? (
            <Loading />
          ) : recentTastings.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-10 h-10" />}
              title="No tastings yet"
              description={isBeer ? "Create a tasting session to start scoring beers" : "Create a tasting session to start scoring wines"}
              action={{ label: "Start Tasting", onClick: () => (window.location.href = "/tastings/new") }}
            />
          ) : (
            <div className="space-y-2">
              {recentTastings.map((tasting) => (
                <Link key={tasting.id} href={`/tastings/${tasting.id}`}>
                  <Card
                    variant="elevated"
                    className="rounded-2xl p-4 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-[#1A1A1A] truncate">
                          {tasting.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#6B7280]">
                            {formatDate(tasting.tastedAt)}
                          </span>
                          {tasting.venue && (
                            <span className="text-xs text-[#9CA3AF]">
                              · {tasting.venue}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C4B8A8] flex-shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
