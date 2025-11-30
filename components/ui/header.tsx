// ❌ Больше нет "use client"

import type React from "react";
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
      {/* Фон (статичный) */}
      <div className="absolute inset-0 bg-[#0c0c0f]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#12121a] to-[#0a0a0d]" />

      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-amber-950/20 to-transparent" />
      <div className="absolute top-0 left-1/4 w-32 h-20 bg-red-500/10 blur-3xl" />
      <div className="absolute top-0 left-1/2 w-32 h-20 bg-emerald-500/10 blur-3xl" />
      <div className="absolute top-0 right-1/4 w-32 h-20 bg-blue-500/10 blur-3xl" />

      {/* Левый блок */}
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

      {/* Правый блок */}
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
