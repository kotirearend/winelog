"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { Plus, Wine, ClipboardList } from "lucide-react";

interface Bottle {
  id: string;
  name: string;
  locationId: string;
  photoUrl?: string;
}

interface Tasting {
  id: string;
  name: string;
  tastedAt: string;
  entryCount?: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [bottlesLoading, setBottlesLoading] = useState(true);
  const [tastingsLoading, setTastingsLoading] = useState(true);
  const [bottlesError, setBottlesError] = useState("");
  const [tastingsError, setTastingsError] = useState("");

  useEffect(() => {
    const fetchBottles = async () => {
      try {
        setBottlesLoading(true);
        const data = await api.get("/bottles?inStock=true");
        setBottles(data.data?.slice(0, 5) || []);
      } catch (error) {
        console.error("Failed to fetch bottles:", error);
        setBottlesError("Failed to load bottles");
      } finally {
        setBottlesLoading(false);
      }
    };

    fetchBottles();
  }, []);

  useEffect(() => {
    const fetchTastings = async () => {
      try {
        setTastingsLoading(true);
        const data = await api.get("/tastings");
        setTastings(data.data?.slice(0, 5) || []);
      } catch (error) {
        console.error("Failed to fetch tastings:", error);
        setTastingsError("Failed to load tastings");
      } finally {
        setTastingsLoading(false);
      }
    };

    fetchTastings();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-var(--cream) to-white">
      {/* Premium Hero Section */}
      <div className="wine-gradient text-white px-4 pt-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-2 mb-8">
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-white/80 text-lg">
              Explore your premium collection
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card variant="elevated" className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {bottles.length}
                </div>
                <div className="text-white/70 text-sm">Bottles in Stock</div>
              </div>
            </Card>
            <Card variant="elevated" className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {tastings.length}
                </div>
                <div className="text-white/70 text-sm">Tastings</div>
              </div>
            </Card>
          </div>

          {/* Quick Add Button */}
          <Link href="/bottles/new" className="block w-full">
            <Button variant="gold" className="w-full h-12 text-base font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg">
              <Plus className="w-5 h-5" />
              Quick Add Bottle
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-10">
        {/* Recent Bottles Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Wine className="w-6 h-6 text-[#7C2D36]" />
              Recent Bottles
            </h2>
            <Link href="/bottles" className="text-[#D4A847] hover:text-[#B8860B] text-sm font-semibold">
              View all
            </Link>
          </div>

          {bottlesLoading ? (
            <div className="flex justify-center py-12">
              <Loading />
            </div>
          ) : bottlesError ? (
            <Card variant="outlined" className="rounded-2xl p-4 border-red-200 bg-red-50">
              <p className="text-sm text-red-700">{bottlesError}</p>
            </Card>
          ) : bottles.length === 0 ? (
            <EmptyState
              icon={<Wine className="w-12 h-12" />}
              title="No bottles yet"
              description="Start building your wine collection by adding your first bottle"
              action={{
                label: "Add Bottle",
                onClick: () => (window.location.href = "/bottles/new"),
              }}
            />
          ) : (
            <div className="grid gap-3">
              {bottles.map((bottle) => (
                <Link key={bottle.id} href={`/bottles/${bottle.id}`}>
                  <Card
                    variant="elevated"
                    className="card-hover rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border border-[#E5E1DB]"
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FDFBF7] to-[#F5F1EB] flex items-center justify-center flex-shrink-0 border border-[#E5E1DB]">
                        {bottle.photoUrl ? (
                          <img
                            src={bottle.photoUrl}
                            alt={bottle.name}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <Wine className="w-8 h-8 text-[#7C2D36]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#1A1A1A] text-base truncate">
                          {bottle.name}
                        </h3>
                        <p className="text-sm text-[#6B7280] mt-1">
                          In your collection
                        </p>
                      </div>
                      <div className="text-[#D4A847] text-xl">→</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tastings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-[#7C2D36]" />
              Recent Tastings
            </h2>
            <Link href="/tastings" className="text-[#D4A847] hover:text-[#B8860B] text-sm font-semibold">
              View all
            </Link>
          </div>

          {tastingsLoading ? (
            <div className="flex justify-center py-12">
              <Loading />
            </div>
          ) : tastingsError ? (
            <Card variant="outlined" className="rounded-2xl p-4 border-red-200 bg-red-50">
              <p className="text-sm text-red-700">{tastingsError}</p>
            </Card>
          ) : tastings.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="w-12 h-12" />}
              title="No tastings yet"
              description="Create your first tasting to record your wine experiences"
              action={{
                label: "Start Tasting",
                onClick: () => (window.location.href = "/tastings"),
              }}
            />
          ) : (
            <div className="grid gap-3">
              {tastings.map((tasting) => (
                <Link key={tasting.id} href={`/tastings/${tasting.id}`}>
                  <Card
                    variant="elevated"
                    className="card-hover rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border border-[#E5E1DB]"
                  >
                    <div className="flex items-center justify-between p-5">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#1A1A1A] text-base mb-1">
                          {tasting.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm">
                          <p className="text-[#6B7280]">
                            {formatDate(tasting.tastedAt)}
                          </p>
                          {tasting.entryCount && (
                            <Badge variant="secondary" className="text-xs">
                              {tasting.entryCount} {tasting.entryCount === 1 ? "entry" : "entries"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        {tasting.entryCount && (
                          <Badge variant="score" className="text-xs">
                            {Math.min(tasting.entryCount, 5)}★
                          </Badge>
                        )}
                        <div className="text-[#D4A847] text-xl">→</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
