"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { validate as isUuid } from "uuid"
import type { SaleItem } from "@/lib/types"
import {
  Play,
  Clock,
  LogOut,
  User,
  Store,
  Wifi,
  WifiOff,
  Package,
  Search,
  History,
  BarChart3,
  Users,
  Banknote,
  CreditCard,
} from "lucide-react"
import { ProductCatalog } from "./components/product-catalog"
import SellPage from "./components/sell-page"
import { FindProductPage } from "./components/find-product-page"
import { AdminDashboard } from "./components/admin-dashboard"
import LoginPage from "./components/auth/login-page"
import { useApp } from "./context/app-context"
import { SalesHistory } from "./components/sales-history"
import { UsersManagement } from "./components/users-management"
import { supabase } from "@/lib/supabase"
import { ShiftStatsModal } from "./components/shift-stats-modal"

type Page = "main" | "catalog" | "sell" | "find" | "admin" | "sales-history" | "users"
type UserRole = "seller" | "owner"

type Visit = {
  id: string
  title: string
  sale_amount: number
  created_at: string
  store_id?: string
  seller_id?: string
  sale_id?: string | null
  seller?: { name: string } | null
}

export default function MainPage() {
  const [currentPage, setCurrentPage] = useState<Page>("main")
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null)
  const [showShiftStatsModal, setShowShiftStatsModal] = useState(false)
  // Добавить новый state для принудительного обновления статистики
  const [statsUpdateTrigger, setStatsUpdateTrigger] = useState(0)

  const {
    currentTime,
    visits: contextVisits,
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
    getShiftStats,
    refreshVisits,
    sales,
    addSale, // ✅ ДОБАВЛЯЕМ addSale из контекста
  } = useApp() as {
    currentTime: string
    visits: Visit[]
    workingHours: number
    workingMinutes: number
    startShift: () => void
    endShift: () => void
    isShiftActive: boolean
    getHourlyEarnings: () => number
    isAuthenticated: boolean
    currentUser: { id: string; name: string; role: UserRole } | null
    currentStore: { id: string; name: string } | null
    isOnline: boolean
    logout: () => void
    getShiftStats: () => {
      totalAmount: number
      cashAmount: number
      terminalAmount: number
      count: number
      totalItems: number
      avgCheck: number
      start: Date
      end: Date
    } | null
    refreshVisits?: () => Promise<void>
    sales: any[]
    addSale: (sale: any) => Promise<void> // ✅ ДОБАВЛЯЕМ тип для addSale
  }

  const [visits, setVisits] = useState<Visit[]>(contextVisits ?? [])

  useEffect(() => {
    setVisits(contextVisits)
  }, [contextVisits])

  // Добавить useEffect для автоматического обновления статистики каждые 30 секунд
  useEffect(() => {
    if (!isShiftActive) return

    const interval = setInterval(() => {
      console.log("🔄 Auto-updating shift stats...")
      setStatsUpdateTrigger((prev) => prev + 1)
    }, 30000) // 30 секунд

    return () => clearInterval(interval)
  }, [isShiftActive])

  const loadSaleItems = useCallback(async (saleId: string | null) => {
    if (!saleId) {
      setItemsError("Продажу не знайдено")
      setSaleItems([])
      return
    }
    setLoadingItems(true)
    setItemsError(null)
    try {
      const { data: saleData, error } = await supabase.from("sales").select("items_data").eq("id", saleId).maybeSingle()
      if (error || !saleData) {
        setItemsError(error?.message || "Продажу не знайдено")
        setSaleItems([])
        return
      }
      const items: SaleItem[] =
        typeof saleData.items_data === "string"
          ? JSON.parse(saleData.items_data)
          : Array.isArray(saleData.items_data)
            ? saleData.items_data
            : []
      setSaleItems(items)
    } catch {
      setItemsError("Помилка завантаження товарів")
      setSaleItems([])
    } finally {
      setLoadingItems(false)
    }
  }, [])

  const onSelectVisit = useCallback(
    (visit: Visit) => {
      const saleId = visit.sale_id && isUuid(visit.sale_id) ? visit.sale_id : null
      setSelectedVisit(visit)
      loadSaleItems(saleId)
    },
    [loadSaleItems],
  )

  const closeModal = () => {
    setSelectedVisit(null)
    setSaleItems([])
    setItemsError(null)
  }

  function generateReceiptNumber(): string {
    const now = new Date()
    return `RCPT-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`
  }

  const createVisit = async (): Promise<string> => {
    if (!currentStore || !currentUser) throw new Error("Не вибрано магазин або користувача")
    // Получаем количество существующих визитов для правильной нумерации
    const { count: existingVisitsCount } = await supabase
      .from("visits")
      .select("id", { count: "exact", head: true })
      .eq("store_id", currentStore.id)

    const visitNumber = (existingVisitsCount || 0) + 1
    const visitTitle = `Візит ${visitNumber}`

    const { data, error } = await supabase
      .from("visits")
      .insert([
        { title: visitTitle, sale_amount: 0, store_id: currentStore.id, seller_id: currentUser.id, sale_id: null },
      ])
      .select()
      .single()

    if (error || !data) throw new Error("Помилка створення візиту: " + (error?.message ?? "Unknown error"))

    if (refreshVisits) await refreshVisits()
    else setVisits((prev) => [...prev, data])

    return data.id
  }

  // ✅ ПОЛНОСТЬЮ ПЕРЕПИСАННАЯ функция createSaleAndLinkVisit
  async function createSaleAndLinkVisit(
    visitId: string,
    saleData: { items_data: SaleItem[]; total_amount: number },
  ): Promise<{ id: string }> {
    console.log("🚀 createSaleAndLinkVisit вызвана!")
    console.log("📦 Sale data:", saleData)
    console.log("🆔 Visit ID:", visitId)

    if (!currentStore || !currentUser) throw new Error("Не вибрано магазин або користувача")

    const receipt_number = generateReceiptNumber()

    console.log("🧾 Generated receipt number:", receipt_number)

    // ✅ ИСПОЛЬЗУЕМ addSale из контекста вместо прямого обращения к Supabase
    console.log("🔄 Вызываем addSale из контекста...")
    await addSale({
      receipt_number,
      total_amount: saleData.total_amount,
      payment_method: "cash",
      items_data: saleData.items_data,
      seller_id: currentUser.id,
    })

    console.log("✅ addSale завершена успешно!")

    // Теперь получаем ID созданной продажи для связи с визитом
    console.log("🔍 Ищем созданную продажу по receipt_number...")
    const { data: createdSale, error: findError } = await supabase
      .from("sales")
      .select("id")
      .eq("receipt_number", receipt_number)
      .maybeSingle()

    if (findError || !createdSale) {
      console.error("❌ Не удалось найти созданную продажу:", findError)
      throw new Error("Помилка пошуку створеної продажі: " + (findError?.message ?? "Unknown error"))
    }

    console.log("✅ Найдена созданная продажа с ID:", createdSale.id)

    // Обновляем визит, связывая его с продажей
    console.log("🔗 Связываем визит с продажей...")
    const { error: visitError } = await supabase
      .from("visits")
      .update({ sale_id: createdSale.id, sale_amount: saleData.total_amount })
      .eq("id", visitId)

    if (visitError) {
      console.error("❌ Ошибка обновления визита:", visitError)
      throw new Error("Помилка оновлення візиту: " + visitError.message)
    }

    console.log("✅ Визит успешно связан с продажей!")

    // Обновляем локальное состояние визитов
    if (refreshVisits) {
      await refreshVisits()
    } else {
      setVisits((prev) =>
        prev.map((v) => (v.id === visitId ? { ...v, sale_id: createdSale.id, sale_amount: saleData.total_amount } : v)),
      )
    }

    console.log("🎉 createSaleAndLinkVisit завершена успешно!")
    return { id: createdSale.id }
  }

  const handleSell = async () => {
    if (!isShiftActive) startShift()
    try {
      const newVisitId = await createVisit()
      setActiveVisitId(newVisitId)
      setCurrentPage("sell")
    } catch (error) {
      alert("Не вдалося створити візит: " + (error as Error).message)
    }
  }

  const handleFindProduct = () => setCurrentPage("find")
  const handleSalesHistory = () => setCurrentPage("sales-history")
  const handleUsersManagement = () => setCurrentPage("users")
  const handleAddProduct = () => setCurrentPage("catalog")
  const handleAdminPanel = () => setCurrentPage("admin")

  const handleBackToMain = () => {
    setCurrentPage("main")
    setActiveVisitId(null)
  }

  const handleLogout = () => {
    logout()
    setCurrentPage("main")
    setActiveVisitId(null)
  }

  const openShiftStatsModal = () => setShowShiftStatsModal(true)
  const closeShiftStatsModal = () => setShowShiftStatsModal(false)

  const confirmEndShift = () => {
    endShift()
    setShowShiftStatsModal(false)
    setVisits([])
    setSelectedVisit(null)
  }

  // ✅ ИСПРАВЛЕНИЕ: Улучшенная функция для вычисления статистики смены
  // В функции calculateCurrentShiftStats добавить логирование времени обновления
  const calculateCurrentShiftStats = () => {
    console.log("📊 Calculating shift stats at:", new Date().toLocaleTimeString())

    if (!isShiftActive || !sales) {
      console.log("❌ No active shift or sales data")
      return null
    }

    // Фильтруем продажи текущей смены
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    console.log("🔍 Filtering sales for current shift...")
    console.log("Total sales available:", sales.length)
    console.log("Current user:", currentUser?.name, "role:", currentUser?.role)
    console.log("Current store:", currentStore?.name)

    const shiftSales = sales.filter((sale) => {
      const saleDate = new Date(sale.created_at)
      const isToday = saleDate >= startOfDay
      const isCurrentUser = currentUser?.role === "seller" ? sale.seller_id === currentUser.id : true
      const isCurrentStore = currentStore ? sale.store_id === currentStore.id : true

      return isToday && isCurrentUser && isCurrentStore
    })

    console.log("📊 Filtered sales for shift:", shiftSales.length)

    const totalAmount = shiftSales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const cashAmount = shiftSales.filter((s) => s.payment_method === "cash").reduce((sum, s) => sum + s.total_amount, 0)
    const terminalAmount = shiftSales
      .filter((s) => s.payment_method === "terminal")
      .reduce((sum, s) => sum + s.total_amount, 0)
    const count = shiftSales.length
    const totalItems = shiftSales.reduce((sum, sale) => sum + (sale.items_data?.length || 0), 0)
    const avgCheck = count > 0 ? totalAmount / count : 0

    // Добавляем недостающие свойства start и end
    const start = startOfDay
    const end = new Date()

    console.log("✅ Calculated shift stats:", {
      start,
      end,
      totalAmount,
      cashAmount,
      terminalAmount,
      count,
      totalItems,
      avgCheck,
    })

    return {
      start,
      end,
      totalAmount,
      cashAmount,
      terminalAmount,
      count,
      totalItems,
      avgCheck,
    }
  }

  if (!isAuthenticated) return <LoginPage />

  // Обновить вызов calculateCurrentShiftStats, добавив зависимость от statsUpdateTrigger
  const shiftStats = getShiftStats() || calculateCurrentShiftStats()

  switch (currentPage) {
    case "sales-history":
      return <SalesHistory onBack={handleBackToMain} />
    case "users":
      return <UsersManagement onBack={handleBackToMain} />
    case "catalog":
      return <ProductCatalog onBack={handleBackToMain} />
    case "sell":
      return <SellPage visitId={activeVisitId ?? ""} onBack={handleBackToMain} onCreateSale={createSaleAndLinkVisit} />
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
            <Button
              onClick={openShiftStatsModal}
              size="sm"
              variant="destructive"
              className="flex items-center gap-2"
              title="Завершити зміну"
            >
              <LogOut className="h-4 w-4" />
              Завершити зміну
            </Button>
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
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4 text-green-400" /> : <WifiOff className="h-4 w-4 text-red-400" />}
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm">{currentUser?.name}</span>
            {currentUser?.role === "owner" && <Badge className="bg-purple-600 text-white text-xs">Власник</Badge>}
            {currentUser?.role === "seller" && <Badge className="bg-blue-600 text-white text-xs">Продавець</Badge>}
          </div>
          {isShiftActive && (
            <div className="flex items-center gap-2 text-sm bg-gray-800 px-3 py-1 rounded">
              <Clock className="h-4 w-4" />
              <span>
                {workingHours} год. {workingMinutes} хв.
              </span>
            </div>
          )}
          <div className="text-lg font-mono bg-gray-800 px-3 py-1 rounded">{currentTime}</div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-gray-800 px-3">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {!isOnline && (
        <div className="bg-yellow-600 text-white px-6 py-2 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>Режим офлайн - деякі функції недоступні</span>
          </div>
        </div>
      )}

      <main className="p-6 space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={handleSell}
            className="bg-black hover:bg-gray-800 text-white h-24 text-lg font-medium rounded-xl relative flex flex-col items-center justify-center gap-2"
            disabled={!isOnline || !isShiftActive}
          >
            <div className="text-2xl">💰</div>
            <span>Продати</span>
            {isShiftActive && <Badge className="absolute top-2 right-2 bg-green-500">Активно</Badge>}
            {!isOnline && <Badge className="absolute top-2 right-2 bg-red-500 text-xs">Офлайн</Badge>}
          </Button>

          <Button
            onClick={handleFindProduct}
            className="bg-black hover:bg-gray-800 text-white h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
          >
            <Search className="h-6 w-6" />
            <span>Знайти товар</span>
          </Button>

          <Button
            onClick={handleSalesHistory}
            className="bg-black hover:bg-gray-800 text-white h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
          >
            <History className="h-6 w-6" />
            <span>Історія продажів</span>
          </Button>

          {currentUser?.role === "owner" && (
            <>
              <Button
                onClick={handleAddProduct}
                className="bg-black hover:bg-gray-800 text-white h-24 text-lg font-medium rounded-xl relative flex flex-col items-center justify-center gap-2"
                disabled={!isOnline}
              >
                <Package className="h-6 w-6" />
                <span>Внести товар</span>
                {!isOnline && <Badge className="absolute top-2 right-2 bg-red-500 text-xs">Офлайн</Badge>}
              </Button>

              <Button
                onClick={handleAdminPanel}
                className="bg-purple-600 hover:bg-purple-700 text-white h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
                disabled={!isOnline}
              >
                <BarChart3 className="h-6 w-6" />
                <span>Адмін панель</span>
              </Button>

              <Button
                onClick={handleUsersManagement}
                className="bg-blue-600 hover:bg-blue-700 text-white h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
                disabled={!isOnline}
              >
                <Users className="h-6 w-6" />
                <span>Користувачі</span>
              </Button>
            </>
          )}
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Візити</h2>
          {visits.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">Візити відсутні</h3>
              <p className="text-gray-500">Почніть зміну та зробіть перший продаж</p>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
                {visits.map((visit, index) => (
                  <Card
                    key={visit.id}
                    onClick={() => onSelectVisit(visit)}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-gray-900 to-black text-white border-gray-700 flex-shrink-0 w-64 ${
                      selectedVisit?.id === visit.id ? "ring-2 ring-blue-500 shadow-xl" : ""
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-medium text-gray-300">{visit.title}</div>
                        <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                          #{visits.length - index}
                        </Badge>
                      </div>
                      <div className="text-center py-2">
                        <div className="text-2xl font-bold text-green-400">{visit.sale_amount.toLocaleString()} ₴</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(visit.created_at).toLocaleTimeString("uk-UA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{new Date(visit.created_at).toLocaleDateString("uk-UA")}</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {visit.seller?.name || "Невідомо"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>

        {shiftStats && isShiftActive && (
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Статистика поточної зміни
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{shiftStats.count || 0}</div>
                  <div className="text-sm text-gray-600">Продажів</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    {(shiftStats.totalAmount || 0).toLocaleString()} ₴
                  </div>
                  <div className="text-sm text-gray-600">Загальна сума</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600">{(shiftStats.avgCheck || 0).toFixed(0)} ₴</div>
                  <div className="text-sm text-gray-600">Середній чек</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-orange-600">
                    {workingHours}г {workingMinutes}хв
                  </div>
                  <div className="text-sm text-gray-600">Час на зміні</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-lg font-bold text-orange-600">
                    {(shiftStats.cashAmount || 0).toLocaleString()} ₴
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Banknote className="h-4 w-4" />
                    Готівка
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-lg font-bold text-indigo-600">
                    {(shiftStats.terminalAmount || 0).toLocaleString()} ₴
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Термінал
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Модальне вікно статистики завершення зміни */}
        <ShiftStatsModal
          isOpen={showShiftStatsModal}
          onClose={closeShiftStatsModal}
          onConfirmEnd={confirmEndShift}
          shiftStats={shiftStats}
          workingHours={workingHours}
          workingMinutes={workingMinutes}
          sellerName={currentUser?.name || "Невідомий"}
          storeName={currentStore?.name || "Невідомий магазин"}
        />

        {/* Деталі вибраного візиту */}
        {selectedVisit && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 overflow-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Візит: {selectedVisit.title}</h3>
                <Button variant="ghost" onClick={closeModal}>
                  Закрити
                </Button>
              </div>
              {loadingItems && <p>Завантаження товарів...</p>}
              {itemsError && <p className="text-red-600">{itemsError}</p>}
              {!loadingItems && !itemsError && (
                <div>
                  {saleItems.length === 0 ? (
                    <p>Товари відсутні</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {saleItems.map((item, idx) => (
                        <li key={idx} className="py-2 flex justify-between">
                          <span>{item.product_name}</span>
                          <span>{item.price.toLocaleString()} ₴</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
