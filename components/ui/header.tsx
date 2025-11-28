"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Wifi, WifiOff, User, Clock, LogOut, Play } from "lucide-react";

interface UserData {
  name: string;
  role: "owner" | "seller" | string;
}

interface StoreData {
  name: string;
}

interface HeaderProps {
  currentStore: StoreData | null;
  currentUser: UserData | null;
  isOnline: boolean;
  isShiftActive: boolean;
  workingHours: number;
  workingMinutes: number;
  currentTime: string;
  startShift: () => void;
  openShiftStatsModal: () => void;
  handleLogout: () => void;
}

const RealisticSnowCanvas: React.FC<{ className?: string }> = ({
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);
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
      swing: number;
      swingSpeed: number;
    }

    const createSnowflakes = (
      count: number,
      layer: "far" | "mid" | "near"
    ): Snowflake[] => {
      const config = {
        far: { radius: [0.5, 1.5], speed: [0.3, 0.6], opacity: [0.2, 0.4] },
        mid: { radius: [1, 2.5], speed: [0.5, 1], opacity: [0.4, 0.7] },
        near: { radius: [2, 4], speed: [1, 1.8], opacity: [0.7, 1] },
      }[layer];

      return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius:
          config.radius[0] +
          Math.random() * (config.radius[1] - config.radius[0]),
        speed:
          config.speed[0] + Math.random() * (config.speed[1] - config.speed[0]),
        wind: (Math.random() - 0.5) * 0.3,
        opacity:
          config.opacity[0] +
          Math.random() * (config.opacity[1] - config.opacity[0]),
        swing: Math.random() * Math.PI * 2,
        swingSpeed: 0.02 + Math.random() * 0.02,
      }));
    };

    const farSnow = createSnowflakes(40, "far");
    const midSnow = createSnowflakes(30, "mid");
    const nearSnow = createSnowflakes(20, "near");

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const drawLayer = (flakes: Snowflake[], blur: number) => {
        ctx.filter = blur > 0 ? `blur(${blur}px)` : "none";
        flakes.forEach((flake) => {
          const gradient = ctx.createRadialGradient(
            flake.x,
            flake.y,
            0,
            flake.x,
            flake.y,
            flake.radius
          );
          gradient.addColorStop(0, `rgba(255, 255, 255, ${flake.opacity})`);
          gradient.addColorStop(
            0.5,
            `rgba(240, 248, 255, ${flake.opacity * 0.6})`
          );
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.radius * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          flake.swing += flake.swingSpeed;
          flake.y += flake.speed;
          flake.x += flake.wind + Math.sin(flake.swing) * 0.3;

          if (flake.y > height + flake.radius) {
            flake.y = -flake.radius * 2;
            flake.x = Math.random() * width;
          }
          if (flake.x > width + 10) flake.x = -10;
          if (flake.x < -10) flake.x = width + 10;
        });
        ctx.filter = "none";
      };

      drawLayer(farSnow, 1);
      drawLayer(midSnow, 0.5);
      drawLayer(nearSnow, 0);

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
      className={
        className ?? "absolute inset-0 w-full h-full pointer-events-none"
      }
    />
  );
};

const RealisticGarland: React.FC<{ className?: string }> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener("resize", resize);

    const bulbColors = [
      { r: 255, g: 80, b: 80 },
      { r: 255, g: 200, b: 60 },
      { r: 80, g: 220, b: 140 },
      { r: 100, g: 180, b: 255 },
      { r: 255, g: 140, b: 200 },
    ];

    const bulbCount = 18;
    const getBulbPosition = (i: number, time: number) => {
      const t = i / (bulbCount - 1);
      const x = t * width;
      const sag = Math.sin(t * Math.PI) * 20;
      const swing = Math.sin(time * 0.001 + i * 0.5) * 1.5;
      const y = 12 + sag + swing;
      return { x, y };
    };

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 16;
      ctx.clearRect(0, 0, width, height);

      ctx.beginPath();
      for (let i = 0; i <= bulbCount - 1; i++) {
        const pos = getBulbPosition(i, time);
        if (i === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      }
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= bulbCount - 1; i++) {
        const pos = getBulbPosition(i, time);
        if (i === 0) ctx.moveTo(pos.x, pos.y - 1);
        else ctx.lineTo(pos.x, pos.y - 1);
      }
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let i = 0; i < bulbCount; i++) {
        const pos = getBulbPosition(i, time);
        const color = bulbColors[i % bulbColors.length];
        const flicker = 0.7 + 0.3 * Math.sin(time * 0.003 + i * 1.2);
        const intensity = flicker;

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x, pos.y + 6);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#4a4a4a";
        ctx.fillRect(pos.x - 3, pos.y + 5, 6, 4);

        const glowRadius = 20 * intensity;
        const glow = ctx.createRadialGradient(
          pos.x,
          pos.y + 15,
          0,
          pos.x,
          pos.y + 15,
          glowRadius
        );
        glow.addColorStop(
          0,
          `rgba(${color.r}, ${color.g}, ${color.b}, ${0.4 * intensity})`
        );
        glow.addColorStop(
          0.5,
          `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 * intensity})`
        );
        glow.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(
          pos.x - glowRadius,
          pos.y + 15 - glowRadius,
          glowRadius * 2,
          glowRadius * 2
        );

        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + 15, 5, 8, 0, 0, Math.PI * 2);

        const bulbGradient = ctx.createRadialGradient(
          pos.x - 2,
          pos.y + 13,
          0,
          pos.x,
          pos.y + 15,
          8
        );
        bulbGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * intensity})`);
        bulbGradient.addColorStop(
          0.3,
          `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`
        );
        bulbGradient.addColorStop(
          0.7,
          `rgba(${Math.floor(color.r * 0.7)}, ${Math.floor(
            color.g * 0.7
          )}, ${Math.floor(color.b * 0.7)}, ${intensity})`
        );
        bulbGradient.addColorStop(
          1,
          `rgba(${Math.floor(color.r * 0.4)}, ${Math.floor(
            color.g * 0.4
          )}, ${Math.floor(color.b * 0.4)}, ${0.8 * intensity})`
        );
        ctx.fillStyle = bulbGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(pos.x - 1.5, pos.y + 11, 1.5, 2.5, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * intensity})`;
        ctx.fill();
      }

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
      className={
        className ?? "absolute top-0 left-0 w-full h-16 pointer-events-none"
      }
    />
  );
};

const Header: React.FC<HeaderProps> = ({
  currentStore,
  currentUser,
  isOnline,
  isShiftActive,
  workingHours,
  workingMinutes,
  currentTime,
  startShift,
  openShiftStatsModal,
  handleLogout,
}) => {
  return (
    <header className="relative overflow-hidden py-4 px-6 flex justify-between items-center text-white h-28 max-h-[110px]">
      <div className="absolute inset-0 bg-[#0c0c0f]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#12121a] to-[#0a0a0d]" />

      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-amber-950/20 to-transparent" />
      <div className="absolute top-0 left-1/4 w-32 h-20 bg-red-500/10 blur-3xl" />
      <div className="absolute top-0 left-1/2 w-32 h-20 bg-emerald-500/10 blur-3xl" />
      <div className="absolute top-0 right-1/4 w-32 h-20 bg-blue-500/10 blur-3xl" />

      <RealisticSnowCanvas className="absolute top-0 left-0 w-full h-24 pointer-events-none" />
      <RealisticGarland className="absolute top-0 left-0 w-full h-16 pointer-events-none" />

      <div className="flex items-center gap-5 relative z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white/95">
            BadPhone
          </h1>
          {currentStore && (
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.06] backdrop-blur-sm flex items-center gap-2 border border-white/[0.08]">
              <Store className="h-4 w-4 text-amber-400/80" />
              <span className="text-sm text-white/80">{currentStore.name}</span>
            </div>
          )}
        </div>

        {isShiftActive ? (
          <Button
            onClick={openShiftStatsModal}
            size="sm"
            className="bg-red-600/90 hover:bg-red-600 text-white border-0 shadow-lg shadow-red-950/50"
          >
            <LogOut className="h-4 w-4 mr-1.5" /> Завершити зміну
          </Button>
        ) : (
          <Button
            onClick={startShift}
            size="sm"
            className="bg-emerald-600/90 hover:bg-emerald-600 text-white border-0 shadow-lg shadow-emerald-950/50"
            disabled={!isOnline}
          >
            <Play className="h-4 w-4 mr-1.5" /> Почати зміну
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {isOnline ? (
          <Wifi className="h-5 w-5 text-emerald-400/90" />
        ) : (
          <WifiOff className="h-5 w-5 text-red-400/90" />
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]">
          <User className="h-4 w-4 text-amber-400/80" />
          <span className="text-sm text-white/80">{currentUser?.name}</span>
          {currentUser?.role === "owner" && (
            <Badge className="bg-violet-600/80 hover:bg-violet-600/80 text-white text-xs border-0">
              Власник
            </Badge>
          )}
          {currentUser?.role === "seller" && (
            <Badge className="bg-blue-600/80 hover:bg-blue-600/80 text-white text-xs border-0">
              Продавець
            </Badge>
          )}
        </div>

        {isShiftActive && (
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400/80" />
            <span className="text-sm text-white/80 tabular-nums">
              {workingHours} год. {workingMinutes} хв.
            </span>
          </div>
        )}

        <div className="px-4 py-1.5 rounded-lg bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] font-mono text-sm text-white/80 tabular-nums">
          {currentTime}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="hover:bg-white/[0.08] rounded-lg h-9 w-9 text-white/70 hover:text-white/90"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
