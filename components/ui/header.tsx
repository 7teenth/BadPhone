"use client";

import type React from "react";
import {
  Menu,
  Store,
  Wifi,
  WifiOff,
  User,
  Clock,
  Play,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

/* ================= TYPES ================= */

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
  onOpenAdmin?: () => void;
  onOpenUsers?: () => void;
}

/* ================= HEADER ================= */

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
  onOpenAdmin,
  onOpenUsers,
}) => {
  return (
    <header className="relative h-20 px-6 flex items-center justify-between border-b border-zinc-800 text-zinc-100">
      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />

      <div className="relative z-10 flex w-full items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          {/* MENU BUTTON */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 transition"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>

            {/* SLIDE MENU */}
            <SheetContent
  side="left"
   className="w-80 bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 shadow-xl shadow-black/40 border-none"
>
  {/* Header */}
  <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
    <div className="text-xl font-semibold tracking-tight">
      Меню
    </div>
  </div>

  {/* Menu items */}
  <div className="mt-6 space-y-2">
    <MenuItem
      icon={Clock}
      title="Статистика зміни"
      description="Переглянути поточну зміну"
      onClick={openShiftStatsModal}
    />

    {currentUser?.role === "owner" && (
      <MenuItem
        icon={Settings}
        title="Адмін панель"
        description="Налаштування та статистика"
        onClick={onOpenAdmin}
      />
    )}

    {currentUser?.role === "owner" && (
      <MenuItem
        icon={Users}
        title="Користувачі"
        description="Ролі та доступи"
        onClick={onOpenUsers}
      />
    )}
  </div>
</SheetContent>

          </Sheet>

          {/* LOGO */}
          <h1 className="text-lg font-semibold tracking-tight">
            BadPhone
          </h1>

          {currentStore && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700">
              <Store className="h-4 w-4 text-zinc-400" />
              <span className="text-sm">{currentStore.name}</span>
            </div>
          )}

          {/* SHIFT */}
          {isShiftActive ? (
            <Button
              size="sm"
              onClick={openShiftStatsModal}
              className="bg-zinc-100 text-black hover:bg-zinc-200"
            >
              Завершити зміну
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={startShift}
              disabled={!isOnline}
              className="bg-zinc-100 text-black hover:bg-zinc-200"
            >
              <Play className="h-4 w-4 mr-1.5" />
              Почати зміну
            </Button>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-emerald-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700">
            <User className="h-4 w-4 text-zinc-400" />
            <span className="text-sm">{currentUser?.name}</span>

            {currentUser?.role === "owner" && (
              <Badge className="bg-zinc-700 border-zinc-600">
                Власник
              </Badge>
            )}
            {currentUser?.role === "seller" && (
              <Badge className="bg-zinc-700 border-zinc-600">
                Продавець
              </Badge>
            )}
          </div>

          {isShiftActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span className="text-sm tabular-nums">
                {workingHours} год {workingMinutes} хв
              </span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700 font-mono text-sm tabular-nums">
            {currentTime}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

/* ================= MENU ITEM ================= */

const MenuItem = ({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 rounded-lg px-4 py-3 bg-zinc-800/60 hover:bg-zinc-800 transition text-left"
    >
      <Icon className="h-5 w-5 mt-0.5 text-zinc-300" />
      <div>
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="text-xs text-zinc-400">
            {description}
          </div>
        )}
      </div>
    </button>
  );
};
