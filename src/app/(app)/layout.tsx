"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/ui/loading";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <Loading variant="page" label="Loading..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="app-container">
      <div className="pb-safe">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
