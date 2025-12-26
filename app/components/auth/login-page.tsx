"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Store, User, Wifi, WifiOff, AlertCircle, Loader2 } from "lucide-react";

interface StoreData {
  id: string;
  name: string;
}

interface LoginFormData {
  login: string;
  password: string;
  storeId: string;
}

// ---------------------------------
// Snow component
// ---------------------------------
const RealisticSnow = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Snowflake {
      x: number;
      y: number;
      radius: number;
      speed: number;
      wind: number;
      opacity: number;
      wobble: number;
      wobbleSpeed: number;
    }

    const snowflakes: Snowflake[] = [];
    const count = 150;

    for (let i = 0; i < count; i++) {
      snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 1 + 0.3,
        wind: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.6 + 0.3,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakes.forEach((flake) => {
        flake.wobble += flake.wobbleSpeed;
        flake.x += flake.wind + Math.sin(flake.wobble) * 0.3;
        flake.y += flake.speed;

        if (flake.y > canvas.height + 10) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width + 10) flake.x = -10;
        if (flake.x < -10) flake.x = canvas.width + 10;

        const gradient = ctx.createRadialGradient(
          flake.x,
          flake.y,
          0,
          flake.x,
          flake.y,
          flake.radius
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${flake.opacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
  );
};

// ---------------------------------
// Garland component
// ---------------------------------
const RealisticGarland = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 120;
    };
    resize();
    window.addEventListener("resize", resize);

    const bulbColors = [
      { r: 255, g: 70, b: 70 },
      { r: 255, g: 180, b: 50 },
      { r: 70, g: 200, b: 120 },
      { r: 70, g: 150, b: 255 },
      { r: 255, g: 100, b: 200 },
    ];

    interface Bulb {
      baseX: number;
      baseY: number;
      color: { r: number; g: number; b: number };
      phase: number;
      swingPhase: number;
    }

    const bulbs: Bulb[] = [];
    const bulbCount = Math.floor(canvas.width / 70);

    for (let i = 0; i < bulbCount; i++) {
      const t = i / (bulbCount - 1);
      const x = t * canvas.width;
      const sag = Math.sin(t * Math.PI) * 25;
      bulbs.push({
        baseX: x,
        baseY: 15 + sag,
        color: bulbColors[i % bulbColors.length],
        phase: Math.random() * Math.PI * 2,
        swingPhase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;
    let animationId: number;

    const animate = () => {
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw wire
      ctx.beginPath();
      ctx.moveTo(0, 15);
      for (let i = 0; i <= canvas.width; i += 5) {
        const t = i / canvas.width;
        const sag = Math.sin(t * Math.PI) * 25;
        ctx.lineTo(i, 15 + sag);
      }
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw bulbs
      bulbs.forEach((bulb) => {
        const swing = Math.sin(time * 1.5 + bulb.swingPhase) * 3;
        const x = bulb.baseX + swing;
        const y = bulb.baseY;
        const flicker = 0.6 + Math.sin(time * 3 + bulb.phase) * 0.4;

        const glowGradient = ctx.createRadialGradient(
          x,
          y + 25,
          0,
          x,
          y + 25,
          40
        );
        glowGradient.addColorStop(
          0,
          `rgba(${bulb.color.r},${bulb.color.g},${bulb.color.b},${
            0.3 * flicker
          })`
        );
        glowGradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(x, y + 25, 40, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(bulb.baseX, bulb.baseY);
        ctx.lineTo(x, y + 8);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(x - 4, y + 5, 8, 8, 1);
        ctx.fillStyle = "#2a2a2a";
        ctx.fill();

        const bulbGradient = ctx.createRadialGradient(
          x - 3,
          y + 18,
          0,
          x,
          y + 22,
          12
        );
        bulbGradient.addColorStop(
          0,
          `rgba(${Math.min(255, bulb.color.r + 100)},${Math.min(
            255,
            bulb.color.g + 100
          )},${Math.min(255, bulb.color.b + 100)},${flicker})`
        );
        bulbGradient.addColorStop(
          0.7,
          `rgba(${bulb.color.r},${bulb.color.g},${bulb.color.b},${flicker})`
        );
        bulbGradient.addColorStop(
          1,
          `rgba(${bulb.color.r * 0.6},${bulb.color.g * 0.6},${
            bulb.color.b * 0.6
          },${flicker})`
        );

        ctx.beginPath();
        ctx.ellipse(x, y + 25, 8, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = bulbGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(x - 3, y + 20, 2, 3, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.5 * flicker})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full pointer-events-none"
      style={{ height: "120px" }}
    />
  );
};

// ---------------------------------
// Login Page
// ---------------------------------
export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    login: "",
    password: "",
    storeId: "",
  });
  // Use app-wide context for stores and login
  const { stores: appStores, storesLoading, login, isOnline } = useApp() as any;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // If stores are available and no store is selected yet, set a sensible default once
  const initialStoreSet = useRef(false);
  useEffect(() => {
    if (initialStoreSet.current) return;
    if (!storesLoading && Array.isArray(appStores) && appStores.length > 0) {
      setFormData((prev) => ({ ...prev, storeId: prev.storeId || appStores[0].id }));
      initialStoreSet.current = true;
    }
  }, [storesLoading, appStores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.login || !formData.password || !formData.storeId) {
      setError("Заповніть всі поля");
      return;
    }

    setIsLoading(true);
    try {
      const ok = await login(
        formData.login.trim(),
        formData.password,
        formData.storeId
      );
      setIsLoading(false);
      if (!ok) {
        setError("Невірний логін або пароль");
      }
      // on success, AppContext will mark authenticated and page.tsx will re-render
    } catch (err) {
      console.error("Login error:", err);
      setIsLoading(false);
      setError("Сталась помилка при вході");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1929] via-[#0a1525] to-[#050a12]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,60,100,0.3),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(10,30,60,0.5),transparent_60%)]" />

      {/* Garland + snow */}
      <RealisticGarland />
      <RealisticSnow />

      {/* Stars (deterministic to avoid hydration mismatch) */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          // deterministic pseudo-random based on index so SSR == client
          const seeded = (index: number, salt = 1) => {
            const v = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
            return Math.abs(v - Math.floor(v));
          };

          const left = `${(seeded(i, 1) * 100).toFixed(6)}%`;
          const top = `${(seeded(i, 2) * 60).toFixed(6)}%`;
          const width = `${(seeded(i, 3) * 2 + 1).toFixed(3)}px`;
          const height = `${(seeded(i, 4) * 2 + 1).toFixed(3)}px`;
          const opacity = +(seeded(i, 5) * 0.5 + 0.2).toFixed(3);
          const animDur = `${(2 + seeded(i, 6) * 3).toFixed(3)}s`;
          const animDelay = `${(seeded(i, 7) * 2).toFixed(3)}s`;

          return (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left,
                top,
                width,
                height,
                opacity,
                animation: `twinkle ${animDur} ease-in-out infinite`,
                animationDelay: animDelay,
              }}
            />
          );
        })}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>

      {/* Login card */}
      <Card className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-lg">
            <Store className="h-8 w-8 text-white/90" />
          </div>
          <CardTitle className="text-2xl font-semibold text-white tracking-wide">
            BadPhone
          </CardTitle>
          <p className="text-white/50 text-sm mt-1">
            Система управління продажами
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {isOnline ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20">
                <Wifi className="h-3 w-3 mr-1" />
                Онлайн
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/20">
                <WifiOff className="h-3 w-3 mr-1" />
                Офлайн
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isOnline && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-amber-200">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Немає підключення до інтернету</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">
                Логін
              </label>
              <Input
                type="text"
                value={formData.login}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, login: e.target.value }))
                }
                placeholder="Введіть ваш логін"
                disabled={isLoading || !isOnline}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">
                Пароль
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Введіть ваш пароль"
                disabled={isLoading || !isOnline}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">
                Магазин
              </label>
              {storesLoading ? (
                <div className="flex items-center justify-center p-3 border rounded-md bg-white/5 border-white/10 text-white/50">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Завантаження магазинів...
                </div>
              ) : (
                <Select
                  value={formData.storeId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, storeId: value }))
                  }
                  disabled={isLoading || !isOnline}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-white/10 [&>span]:text-white/50 data-[state=open]:border-white/30">
                    <SelectValue placeholder="Виберіть магазин" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2535] border-white/10">
                    {(appStores || []).map((store: any) => (
                      <SelectItem
                        key={store.id}
                        value={store.id}
                        className="text-white/80 focus:bg-white/10 focus:text-white"
                      >
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-white/50" />
                          <span>{store.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all duration-300"
              disabled={
                isLoading || !isOnline || storesLoading || !formData.storeId
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Вхід...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Увійти
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-white/30">
              Версія 1.0.5 &bull; 2025 BadPhone
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
