"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/app-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Store, User, Wifi, WifiOff, AlertCircle, Loader2 } from "lucide-react";

interface LoginFormData {
  login: string;
  password: string;
  storeId: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    login: "",
    password: "",
    storeId: "",
  });

  const { stores, storesLoading, login, isOnline } = useApp() as {
    stores: { id: string; name: string }[];
    storesLoading: boolean;
    login: (
      login: string,
      password: string,
      storeId: string
    ) => Promise<boolean>;
    isOnline: boolean;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const initialStoreSet = useRef(false);

  useEffect(() => {
    if (!initialStoreSet.current && !storesLoading && stores?.length > 0) {
      setFormData((prev) => ({
        ...prev,
        storeId: prev.storeId || stores[0].id,
      }));
      initialStoreSet.current = true;
    }
  }, [storesLoading, stores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.login || !formData.password || !formData.storeId) {
      setError("Будь ласка, заповніть усі поля");
      return;
    }

    setIsLoading(true);
    try {
      const ok = await login(
        formData.login.trim(),
        formData.password,
        formData.storeId
      );
      if (!ok) {
        setError("Невірний логін або пароль");
      }
    } catch {
      setError("Сталася помилка під час входу");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      {/* Фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_60%)]" />

      {/* Картка входу */}
      <Card
        className="
          relative z-10
          w-full max-w-md
          bg-zinc-900/80
          backdrop-blur-xl
          border border-zinc-800
          shadow-xl
        "
      >
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Store className="h-6 w-6 text-zinc-200" />
          </div>

          <CardTitle className="text-2xl font-semibold text-zinc-100">
            BadPhone
          </CardTitle>
          <p className="text-sm text-zinc-400">
            Система управління продажами
          </p>

          <div className="flex justify-center">
            {isOnline ? (
              <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700">
                <Wifi className="h-3 w-3 mr-1" />
                Онлайн
              </Badge>
            ) : (
              <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700">
                <WifiOff className="h-3 w-3 mr-1" />
                Офлайн
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {!isOnline && (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-300">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Немає підключення до інтернету
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Логін */}
            <div className="space-y-1">
              <label className="text-sm text-zinc-400">Логін</label>
              <Input
                value={formData.login}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, login: e.target.value }))
                }
                disabled={isLoading || !isOnline}
                placeholder="Введіть логін"
                className="
                  bg-zinc-800 border-zinc-700 text-zinc-100
                  placeholder:text-zinc-500
                  focus:border-zinc-500 focus:ring-0
                "
              />
            </div>

            {/* Пароль */}
            <div className="space-y-1">
              <label className="text-sm text-zinc-400">Пароль</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, password: e.target.value }))
                }
                disabled={isLoading || !isOnline}
                placeholder="Введіть пароль"
                className="
                  bg-zinc-800 border-zinc-700 text-zinc-100
                  placeholder:text-zinc-500
                  focus:border-zinc-500 focus:ring-0
                "
              />
            </div>

            {/* Магазини */}
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Магазин</label>

              {storesLoading ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Завантаження магазинів…
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {stores.map((store) => {
                    const selected = store.id === formData.storeId;
                    return (
                      <button
                        key={store.id}
                        type="button"
                        disabled={isLoading || !isOnline}
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            storeId: store.id,
                          }))
                        }
                        className={`
                          px-3 py-2 rounded-lg border text-sm transition
                          ${
                            selected
                              ? "bg-zinc-700 border-zinc-500 text-white"
                              : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                          }
                        `}
                      >
                        {store.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Помилка */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Кнопка входу */}
            <Button
              type="submit"
              disabled={
                isLoading || !isOnline || storesLoading || !formData.storeId
              }
              className="
                w-full bg-white text-black
                hover:bg-zinc-200 font-medium
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Вхід…
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Увійти
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 text-center text-xs text-zinc-500 border-t border-zinc-800">
            Версія 1.0.6 · © 2025 BadPhone
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
