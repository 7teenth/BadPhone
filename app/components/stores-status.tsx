"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "../context/app-context";
import { ArrowLeft, Clock, User, DollarSign, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StoresStatusProps {
  onBack: () => void;
}

export function StoresStatus({ onBack }: StoresStatusProps) {
  const { stores, currentShift, sales, users } = useApp();
  const [storeStats, setStoreStats] = useState<any[]>([]);

  // Обчислюємо статистику для кожного магазину
  useEffect(() => {
    const stats = stores.map((store) => {
      // Перевіряємо, чи активна зміна в цьому магазині
      const isStoreActive =
        currentShift &&
        currentShift.store_id === store.id &&
        !currentShift.end_time;

      // Отримуємо користувача, який почав зміну
      const shiftUser = isStoreActive
        ? users?.find((u) => u.id === currentShift.user_id)
        : null;

      // Отримуємо продажі для цього магазину (поточний день)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const storeSales =
        sales?.filter((s) => {
          if (s.store_id !== store.id) return false;
          const saleDate = new Date(s.created_at);
          saleDate.setHours(0, 0, 0, 0);
          return saleDate.getTime() === today.getTime();
        }) || [];

      const totalSalesAmount = storeSales.reduce(
        (sum, s) => sum + s.total_amount,
        0
      );

      // Обчислюємо тривалість зміни
      let shiftDuration = "";
      if (isStoreActive && currentShift) {
        const startTime = new Date(currentShift.start_time);
        const endTime = currentShift.end_time
          ? new Date(currentShift.end_time)
          : new Date();

        const diff = Math.floor(
          (endTime.getTime() - startTime.getTime()) / 1000 / 60
        );

        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;

        shiftDuration =
          hours > 0
            ? `${hours} год ${minutes} хв`
            : minutes > 0
            ? `${minutes} хв`
            : "0 хв";
      }

      return {
        store,
        activeShift: isStoreActive ? currentShift : null,
        shiftUser,
        storeSales,
        totalSalesAmount,
        shiftDuration,
        isActive: isStoreActive,
      };
    });

    setStoreStats(stats);
  }, [stores, currentShift, sales, users]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-gray-800"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Статус магазинів</h1>
      </header>

      {/* Content */}
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        {storeStats.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Немає магазинів</p>
          </Card>
        ) : (
          storeStats.map((stat) => (
            <Card
              key={stat.store.id}
              className={`transition-all ${
                stat.isActive
                  ? "border-green-500 border-2 bg-green-50"
                  : "border-gray-300"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {stat.store.name}
                    </CardTitle>
                    <Badge
                      className={
                        stat.isActive
                          ? "bg-green-600 text-white"
                          : "bg-gray-400 text-white"
                      }
                    >
                      {stat.isActive ? "✓ Активна" : "Закрита"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {stat.isActive && stat.activeShift && stat.shiftUser ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Користувач */}
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <User className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Користувач</p>
                        <p className="font-semibold text-sm">
                          {stat.shiftUser.name}
                        </p>
                      </div>
                    </div>

                    {/* Тривалість */}
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">
                          Тривалість зміни
                        </p>
                        <p className="font-semibold text-sm">
                          {stat.shiftDuration}
                        </p>
                      </div>
                    </div>

                    {/* Кількість продажів */}
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <ShoppingCart className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">Продажі</p>
                        <p className="font-semibold text-sm">
                          {stat.storeSales.length}
                        </p>
                      </div>
                    </div>

                    {/* Сума продажів */}
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <DollarSign className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-600">На суму</p>
                        <p className="font-semibold text-sm">
                          {formatCurrency(stat.totalSalesAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>Зміна не активна</p>
                    {stat.store.address && (
                      <p className="text-sm mt-2">{stat.store.address}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
