"use client"

import { ShiftControl } from "../components/shift-control"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Play, Clock, LogOut, User, BarChart3, Store, Wifi, WifiOff, Package, Search, History } from "lucide-react"
import { ProductCatalog } from "./components/product-catalog"
import SellPage from "./components/sell-page"
import { FindProductPage } from "./components/find-product-page"
import { AdminDashboard } from "./components/admin-dashboard"
import LoginPage from "./components/auth/login-page"
import { useApp } from "./context/app-context"
import { SalesHistory } from "./components/sales-history"
import { UsersManagement } from "./components/users-management"

type Page = "main" | "catalog" | "sell" | "find" | "admin" | "sales-history" | "users"

type UserRole = "seller" | "owner"

export default function MainPage() {
  const [currentPage, setCurrentPage] = useState<Page>("main")
  const {
    currentTime,
    visits,
    totalSalesAmount,
    workingHours,
    workingMinutes,
    startShift,
    endShift,
    isShiftActive,
    getHourlyEarnings,
    isAuthenticated,
    currentUser,
    currentStore,
    isOnline,
    logout,
  } = useApp() as {
    currentTime: string
    visits: any[]
    totalSalesAmount: number
    workingHours: number
    workingMinutes: number
    startShift: () => void
    endShift: () => void
    isShiftActive: boolean
    getHourlyEarnings: () => number
    isAuthenticated: boolean
    currentUser: { name: string; role: UserRole } | null
    currentStore: { name: string } | null
    isOnline: boolean
    logout: () => void
  }

  if (!isAuthenticated) return <LoginPage />

  const handleSell = () => {
    if (!isShiftActive) startShift()
    setCurrentPage("sell")
  }

  const handleFindProduct = () => setCurrentPage("find")
  const handleSalesHistory = () => setCurrentPage("sales-history")
  const handleUsersManagement = () => setCurrentPage("users")
  const handleAddProduct = () => setCurrentPage("catalog")
  const handleAdminPanel = () => setCurrentPage("admin")
  const handleBackToMain = () => setCurrentPage("main")

  const handleShiftToggle = () => {
    if (isShiftActive) endShift()
    else startShift()
  }

  const handleLogout = () => {
    logout()
    setCurrentPage("main")
  }

  switch (currentPage) {
    case "sales-history":
      return <SalesHistory onBack={handleBackToMain} />
    case "users":
      return <UsersManagement onBack={handleBackToMain} />
    case "catalog":
      return <ProductCatalog onBack={handleBackToMain} />
    case "sell":
      return <SellPage onBack={handleBackToMain} />
    case "find":
      return <FindProductPage onBack={handleBackToMain} />
    case "admin":
      return <AdminDashboard onBack={handleBackToMain} />
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">BadPhone</h1>
            {currentStore && (
              <div className="flex items-center gap-1 text-sm bg-gray-800 px-2 py-1 rounded">
                <Store className="h-3 w-3" />
                <span>{currentStore.name}</span>
              </div>
            )}
          </div>
          {isShiftActive ? (
            <ShiftControl />
          ) : (
            <Button
              onClick={startShift}
              size="sm"
              variant="secondary"
              className="flex items-center gap-2"
              disabled={!isOnline}
            >
              <Play className="h-4 w-4" />
              Почати зміну
            </Button>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Статус підключення */}
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4 text-green-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
          </div>

          {/* Інформація про користувача */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm">{currentUser?.name}</span>
            {currentUser?.role === "owner" && <Badge className="bg-purple-600 text-white text-xs">Власник</Badge>}
            {currentUser?.role === "seller" && <Badge className="bg-blue-600 text-white text-xs">Продавець</Badge>}
          </div>

          {/* Час на зміні */}
          {isShiftActive && (
            <div className="flex items-center gap-2 text-sm bg-gray-800 px-3 py-1 rounded">
              <Clock className="h-4 w-4" />
              <span>
                {workingHours} год. {workingMinutes} хв.
              </span>
            </div>
          )}

          {/* Поточний час */}
          <div className="text-lg font-mono bg-gray-800 px-3 py-1 rounded">{currentTime}</div>

          {/* Кнопка виходу */}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-gray-800 px-3">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Попередження офлайн */}
      {!isOnline && (
        <div className="bg-yellow-600 text-white px-6 py-2 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>Режим офлайн - деякі функції недоступні</span>
          </div>
        </div>
      )}

      {/* Основний контент */}
      <div className="p-6 space-y-6">
        {/* Статус зміни */}
        {!isShiftActive && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Зміна не розпочата</span>
                <span className="text-sm">- натисніть "Почати зміну" для початку роботи</span>
                {!isOnline && <span className="text-sm">(потрібен інтернет)</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Кнопки дій */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Продати - доступно всім */}
          <Button
            onClick={handleSell}
            className="bg-green-600 hover:bg-green-700 text-white h-24 text-lg font-medium rounded-xl relative flex flex-col items-center justify-center gap-2"
            disabled={!isOnline || !isShiftActive}
          >
            <div className="text-2xl">💰</div>
            <span>Продати</span>
            {isShiftActive && <Badge className="absolute top-2 right-2 bg-green-500">Активно</Badge>}
            {!isOnline && <Badge className="absolute top-2 right-2 bg-red-500 text-xs">Офлайн</Badge>}
          </Button>

          {/* Знайти товар - доступно всім */}
          <Button
            onClick={handleFindProduct}
            className="bg-blue-600 hover:bg-blue-700 text-white h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
          >
            <Search className="h-6 w-6" />
            <span>Знайти товар</span>
          </Button>

          {/* Історія продажів - доступно всім */}
          <Button
            onClick={handleSalesHistory}
            className="bg-purple-600 hover:bg-purple-700 text-white h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
          >
            <History className="h-6 w-6" />
            <span>Історія продажів</span>
          </Button>

          {/* ✅ ИСПРАВЛЕНИЕ: Внести товар - только для owner */}
          {currentUser?.role === "owner" && (
            <Button
              onClick={handleAddProduct}
              className="bg-orange-600 hover:bg-orange-700 text-white h-24 text-lg font-medium rounded-xl relative flex flex-col items-center justify-center gap-2"
              disabled={!isOnline}
            >
              <Package className="h-6 w-6" />
              <span>Внести товар</span>
              {!isOnline && <Badge className="absolute top-2 right-2 bg-red-500 text-xs">Офлайн</Badge>}
            </Button>
          )}
        </div>

        {/* ✅ ИСПРАВЛЕНИЕ: Админ панель - только для owner, отдельный блок */}
        {currentUser?.role === "owner" && (
          <div className="mt-6">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Адміністрування</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={handleAdminPanel}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
              >
                <BarChart3 className="h-6 w-6" />
                <span>Адмін панель</span>
              </Button>

              <Button
                onClick={handleUsersManagement}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
              >
                <User className="h-6 w-6" />
                <span>Користувачі</span>
              </Button>
            </div>
          </div>
        )}

        {/* Управління візитами */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium text-gray-800">Візити</h2>
            {visits.length > 0 && (
              <Badge variant="secondary">
                Сьогодні:{" "}
                {visits.filter((v) => new Date(v.created_at).toDateString() === new Date().toDateString()).length}
              </Badge>
            )}
          </div>
          {visits.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Візитів поки немає</p>
              <p className="text-sm text-gray-400">Візити з'являться після перших продажів</p>
            </Card>
          ) : (
            <ScrollArea className="w-full overflow-x-auto">
              <div className="flex flex-row-reverse gap-4 pb-4 w-max">
                {visits.map((visit) => (
                  <Card
                    key={visit.id}
                    className="bg-black hover:bg-gray-800 cursor-pointer transition-colors flex-shrink-0 w-48"
                    onClick={() => console.log(`Візит ${visit.id} clicked`)}
                  >
                    <CardContent className="p-6 flex flex-col items-center justify-center h-24">
                      <span className="text-white text-lg font-medium">{visit.title}</span>
                      <span className="text-gray-300 text-sm">{visit.sale_amount.toLocaleString()} ₴</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(visit.created_at).toLocaleTimeString("uk-UA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Нижній блок зі статистикою */}
      <div className="bg-gray-300 p-6 space-y-2 text-gray-800">
        <div className="text-lg">
          <span className="font-medium">Всього продано на суму:</span> {totalSalesAmount.toLocaleString()} грн.
        </div>
        <div className="text-lg">
          <span className="font-medium">Час на зміні:</span> {workingHours} год. {workingMinutes} хв.
        </div>
        <div className="text-lg">
          <span className="font-medium">Грн в годину:</span> {getHourlyEarnings().toLocaleString()} грн.
          {workingHours === 0 && workingMinutes === 0 && (
            <span className="text-sm text-gray-600 ml-2">(почніть зміну)</span>
          )}
        </div>
        {isShiftActive && (
          <div className="text-sm text-gray-600 mt-2 flex items-center gap-4">
            <div>
              <span>Статус: </span>
              <Badge className="bg-green-600 text-white">Зміна активна</Badge>
            </div>
            <div>
              <span>{currentUser?.role === "owner" ? "Власник" : "Продавець"}: </span>
              <Badge variant="outline">{currentUser?.name}</Badge>
            </div>
            {currentStore && (
              <div>
                <span>Магазин: </span>
                <Badge variant="outline">{currentStore.name}</Badge>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
