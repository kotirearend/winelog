"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6 p-4 pb-24">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">
          Welcome, {user?.name}
        </h1>
        <p className="text-[#6B7280]">Your wine collection awaits</p>
      </div>

      {/* Quick Action: Add Bottle */}
      <Link href="/bottles/new" className="block">
        <Button className="w-full h-14 bg-[#7C2D36] hover:bg-[#9B3A44] flex items-center justify-center gap-2 text-lg">
          <Plus className="w-5 h-5" />
          Add New Bottle
        </Button>
      </Link>

      {/* Recent Bottles Section */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Recent Bottles</h2>

        {bottlesLoading ? (
          <div className="flex justify-center py-8">
            <Loading />
          </div>
        ) : bottlesError ? (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{bottlesError}</p>
          </div>
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
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-lg bg-[#FDFBF7] flex items-center justify-center flex-shrink-0">
                      {bottle.photoUrl ? (
                        <img
                          src={bottle.photoUrl}
                          alt={bottle.name}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <Wine className="w-6 h-6 text-[#7C2D36]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#1A1A1A] truncate">
                        {bottle.name}
                      </h3>
                      <p className="text-sm text-[#6B7280] truncate">
                        &nbsp;
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Tastings Section */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Recent Tastings</h2>

        {tastingsLoading ? (
          <div className="flex justify-center py-8">
            <Loading />
          </div>
        ) : tastingsError ? (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{tastingsError}</p>
          </div>
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
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-[#1A1A1A]">
                        {tasting.name}
                      </h3>
                      <p className="text-sm text-[#6B7280]">
                        {formatDate(tasting.tastedAt)}
                      </p>
                    </div>
                    <ClipboardList className="w-5 h-5 text-[#7C2D36] flex-shrink-0 ml-2" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
