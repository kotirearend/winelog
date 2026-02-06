"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

interface FredInstance {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
}

export function FredCelebration({ onClose }: { onClose: () => void }) {
  const { beverageType } = useAuth();
  const isBeer = beverageType === "beer";
  const label = isBeer ? "BEERLOG" : "WINELOG";

  const [freds, setFreds] = useState<FredInstance[]>([]);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fredsRef = useRef<FredInstance[]>([]);

  // Spawn multiple Freds bouncing around
  useEffect(() => {
    const initial: FredInstance[] = [];
    for (let i = 0; i < 6; i++) {
      initial.push({
        id: i,
        x: Math.random() * (window.innerWidth - 120),
        y: Math.random() * (window.innerHeight - 120),
        dx: (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1),
        dy: (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() * 6 + 2) * (Math.random() > 0.5 ? 1 : -1),
        size: 80 + Math.random() * 60,
      });
    }
    fredsRef.current = initial;
    setFreds(initial);

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      fredsRef.current = fredsRef.current.map((fred) => {
        let { x, y, dx, dy, rotation, rotationSpeed, size } = fred;
        x += dx;
        y += dy;
        rotation += rotationSpeed;

        // Bounce off walls
        if (x <= 0 || x >= w - size) {
          dx = -dx;
          x = Math.max(0, Math.min(x, w - size));
        }
        if (y <= 0 || y >= h - size) {
          dy = -dy;
          y = Math.max(0, Math.min(y, h - size));
        }

        return { ...fred, x, y, dx, dy, rotation };
      });

      setFreds([...fredsRef.current]);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Play the beefy soundbite
    try {
      const audio = new Audio("/beefy.mp3");
      audio.volume = 1.0;
      audio.play();
    } catch (err) {
      console.error("Could not play celebration audio:", err);
    }

    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 8000);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden cursor-pointer"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      {/* Bouncing Freds */}
      {freds.map((fred) => (
        <div
          key={fred.id}
          className="absolute"
          style={{
            left: fred.x,
            top: fred.y,
            width: fred.size,
            height: fred.size,
            transform: `rotate(${fred.rotation}deg)`,
            willChange: "transform, left, top",
          }}
        >
          <img
            src="/fred.png"
            alt="Fred"
            className="w-full h-full rounded-full object-cover border-4 border-[#D4A847] shadow-2xl"
            style={{ pointerEvents: "none" }}
          />
        </div>
      ))}

      {/* Bouncing text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center animate-bounce">
          <h1
            className="font-black tracking-wider"
            style={{
              fontSize: "clamp(3rem, 12vw, 8rem)",
              color: isBeer ? "#B45309" : "#7C2D36",
              textShadow: "0 0 40px rgba(212,168,71,0.8), 0 4px 8px rgba(0,0,0,0.5)",
              WebkitTextStroke: "2px #D4A847",
            }}
          >
            {label}
          </h1>
          <h1
            className="font-black tracking-wider"
            style={{
              fontSize: "clamp(3rem, 12vw, 8rem)",
              color: "#D4A847",
              textShadow: "0 0 40px rgba(212,168,71,0.8), 0 4px 8px rgba(0,0,0,0.5)",
              WebkitTextStroke: isBeer ? "2px #B45309" : "2px #7C2D36",
            }}
          >
            {label}
          </h1>
          <p className="text-white text-xl font-bold mt-4 opacity-80 animate-pulse">
            PERFECT SESSION — TAP TO CLOSE
          </p>
        </div>
      </div>
    </div>
  );
}
