"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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

// Простые компоненты вместо shadcn/ui
const Button = ({
  children,
  onClick,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  title,
  ...props
}: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`px-4 py-2 rounded font-medium transition-colors ${
      variant === "outline"
        ? "border border-gray-300 bg-white hover:bg-gray-50"
        : variant === "ghost"
          ? "bg-transparent hover:bg-gray-100"
          : variant === "destructive"
            ? "bg-red-600 text-white hover:bg-red-700"
            : variant === "secondary"
              ? "bg-gray-600 text-white hover:bg-gray-700"
              : variant === "purple"
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-black text-white hover:bg-gray-800"
    } ${size === "sm" ? "px-2 py-1 text-sm" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    {...props}
  >
    {children}
  </button>
)

const Card = ({ children, className = "", onClick }: any) => (
  <div onClick={onClick} className={`bg-white rounded-lg shadow border ${className}`}>
    {children}
  </div>
)

const CardContent = ({ children, className = "" }: any) => <div className={`p-6 ${className}`}>{children}</div>

const CardHeader = ({ children, className = "" }: any) => <div className={`p-6 pb-0 ${className}`}>{children}</div>

const CardTitle = ({ children, className = "" }: any) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)

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
  const [statsUpdateTrigger, setStatsUpdateTrigger] = useState(0)

  // Улучшенная система предотвращения дублирования
  const [isCreatingVisit, setIsCreatingVisit] = useState(false)
  const [isCreatingSale, setIsCreatingSale] = useState(false)
  const lastVisitCreationTime = useRef<number>(0)
  const lastSaleCreationTime = useRef<number>(0)

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
    addSale,
    loadData, // ✅ Добавляем loadData для обновления всех данных
    currentShift,
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
    addSale: (sale: any) => Promise<void>
    loadData: (user: any) => Promise<void> // ✅ Добавляем типизацию
    currentShift: { id: string; start_time: string; end_time: string } | null
  }

  const [visits, setVisits] = useState<Visit[]>(contextVisits ?? [])

  useEffect(() => {
    setVisits(contextVisits || [])
  }, [contextVisits])

  useEffect(() => {
    if (!isShiftActive) return

    const interval = setInterval(() => {
      console.log("🔄 Auto-updating shift stats...")
      setStatsUpdateTrigger((prev) => prev + 1)
    }, 30000)

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
    } catch (error) {
      console.error("Error loading sale items:", error)
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

  // ✅ ИСПРАВЛЕННАЯ функция создания визита с прямым обращением к Supabase
  const createVisit = async (): Promise<string> => {
    if (!currentStore || !currentUser) {
      throw new Error("Не вибрано магазин або користувача")
    }

    const now = Date.now()
    if (now - lastVisitCreationTime.current < 2000) {
      console.log("⚠️ Visit creation blocked - too soon after last creation")
      throw new Error("Зачекайте перед створенням нового візиту")
    }

    if (isCreatingVisit) {
      console.log("⚠️ Visit creation already in progress")
      throw new Error("Візит вже створюється")
    }

    setIsCreatingVisit(true)
    lastVisitCreationTime.current = now

    try {
      console.log("🔄 Creating new visit...")

      // ✅ Используем прямое обращение к Supabase вместо API роута
      const { count: existingVisitsCount } = await supabase
        .from("visits")
        .select("id", { count: "exact", head: true })
        .eq("store_id", currentStore.id)

      const visitNumber = (existingVisitsCount || 0) + 1
      const visitTitle = `Візит ${visitNumber}`

      const { data, error } = await supabase
        .from("visits")
        .insert([
          {
            title: visitTitle,
            sale_amount: 0,
            store_id: currentStore.id,
            seller_id: currentUser.id,
            sale_id: null,
          },
        ])
        .select()
        .single()

      if (error || !data) {
        throw new Error("Помилка створення візиту: " + (error?.message ?? "Unknown error"))
      }

      console.log("✅ Visit created successfully:", data.id)

      // ✅ Обновляем данные через контекст
      if (refreshVisits) {
        await refreshVisits()
      }

      return data.id
    } catch (error) {
      console.error("❌ Error creating visit:", error)
      throw error
    } finally {
      setIsCreatingVisit(false)
    }
  }

  // ✅ ИСПРАВЛЕННАЯ функция создания продажи
  async function createSaleAndLinkVisit(
    visitId: string,
    saleData: { items_data: SaleItem[]; total_amount: number },
  ): Promise<{ id: string }> {
    console.log("🚀 createSaleAndLinkVisit called!")

    if (!currentStore || !currentUser) {
      throw new Error("Не вибрано магазин або користувача")
    }

    const now = Date.now()
    if (now - lastSaleCreationTime.current < 3000) {
      console.log("⚠️ Sale creation blocked - too soon after last creation")
      throw new Error("Зачекайте перед створенням нової продажі")
    }

    if (isCreatingSale) {
      console.log("⚠️ Sale creation already in progress")
      throw new Error("Продаж вже створюється")
    }

    if (!saleData.items_data || saleData.items_data.length === 0) {
      throw new Error("Немає товарів для продажу")
    }

    if (!saleData.total_amount || saleData.total_amount <= 0) {
      throw new Error("Некоректна сума продажу")
    }

    setIsCreatingSale(true)
    lastSaleCreationTime.current = now

    const receipt_number = generateReceiptNumber()
    console.log("🧾 Generated receipt number:", receipt_number)

    try {
      console.log("🔄 Creating sale...")

      // Создаем продажу через контекст
      await addSale({
        receipt_number,
        total_amount: saleData.total_amount,
        payment_method: "cash",
        items_data: saleData.items_data,
        seller_id: currentUser.id,
      })

      console.log("✅ Sale created successfully!")

      // Небольшая задержка для обеспечения записи в БД
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Ищем созданную продажу
      console.log("🔍 Finding created sale...")
      const { data: createdSale, error: findError } = await supabase
        .from("sales")
        .select("id")
        .eq("receipt_number", receipt_number)
        .eq("seller_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (findError || !createdSale) {
        console.error("❌ Failed to find created sale:", findError)
        throw new Error("Помилка пошуку створеної продажі: " + (findError?.message ?? "Unknown error"))
      }

      console.log("✅ Found created sale with ID:", createdSale.id)

      // Связываем визит с продажей
      console.log("🔗 Linking visit with sale...")
      const { error: visitError } = await supabase
        .from("visits")
        .update({ sale_id: createdSale.id, sale_amount: saleData.total_amount })
        .eq("id", visitId)

      if (visitError) {
        console.error("❌ Error updating visit:", visitError)
        throw new Error("Помилка оновлення візиту: " + visitError.message)
      }

      console.log("✅ Visit linked with sale successfully!")

      // ✅ Обновляем все данные через контекст
      if (refreshVisits) {
        await refreshVisits()
      }

      console.log("🎉 createSaleAndLinkVisit completed successfully!")
      return { id: createdSale.id }
    } catch (error) {
      console.error("❌ Error in createSaleAndLinkVisit:", error)
      throw error
    } finally {
      setIsCreatingSale(false)
    }
  }

  const handleSell = async () => {
    console.log("🛒 handleSell called")

    if (!isShiftActive) {
      startShift()
    }

    if (isCreatingVisit) {
      console.log("⚠️ Visit creation already in progress, ignoring click")
      return
    }

    try {
      const newVisitId = await createVisit()
      setActiveVisitId(newVisitId)
      setCurrentPage("sell")
    } catch (error) {
      console.error("❌ Error starting sale:", error)
      alert("Не вдалося створити візит: " + (error as Error).message)
    }
  }

  const handleFindProduct = () => setCurrentPage("find")
  const handleSalesHistory = () => setCurrentPage("sales-history")
  const handleUsersManagement = () => setCurrentPage("users")
  const handleAddProduct = () => setCurrentPage("catalog")
  const handleAdminPanel = () => setCurrentPage("admin")

  // ✅ ИСПРАВЛЕННАЯ функция возврата на главную с обновлением данных
  const handleBackToMain = async () => {
    console.log("🏠 Returning to main page...")

    setCurrentPage("main")
    setActiveVisitId(null)

    // ✅ Обновляем только визиты и продажи, не трогаем смену
    if (currentUser && isOnline && refreshVisits) {
      try {
        await refreshVisits()
        console.log("✅ Visits refreshed successfully")
      } catch (error) {
        console.error("❌ Error refreshing visits:", error)
      }
    }
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

  const calculateCurrentShiftStats = () => {
    console.log("📊 Calculating shift stats at:", new Date().toLocaleTimeString())

    if (!isShiftActive || !sales || !Array.isArray(sales)) {
      console.log("❌ No active shift or sales data")
      return null
    }

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    console.log("🔍 Filtering sales for current shift...")
    const shiftSales = sales.filter((sale) => {
      if (!sale || !sale.created_at) return false

      try {
        const saleDate = new Date(sale.created_at)
        // Проверяем, что продажа была сделана во время текущей смены
        const shiftStart = currentShift ? new Date(currentShift.start_time) : startOfDay
        const isInShift = saleDate >= shiftStart
        const isCurrentUser = currentUser?.role === "seller" ? sale.seller_id === currentUser.id : true
        const isCurrentStore = currentStore ? sale.store_id === currentStore.id : true

        return isInShift && isCurrentUser && isCurrentStore
      } catch (error) {
        console.error("Error filtering sale:", error, sale)
        return false
      }
    })

    console.log("📊 Filtered sales for shift:", shiftSales.length)
    console.log(
      "💰 Sales amounts:",
      shiftSales.map((s) => s.total_amount),
    )
    console.log("🕐 Current shift start:", currentShift?.start_time)

    const totalAmount = shiftSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
    const cashAmount = shiftSales
      .filter((s) => s.payment_method === "cash")
      .reduce((sum, s) => sum + (s.total_amount || 0), 0)
    const terminalAmount = shiftSales
      .filter((s) => s.payment_method === "terminal")
      .reduce((sum, s) => sum + (s.total_amount || 0), 0)

    const count = shiftSales.length
    const totalItems = shiftSales.reduce((sum, sale) => {
      if (!sale.items_data) return sum
      try {
        const items = Array.isArray(sale.items_data) ? sale.items_data : JSON.parse(sale.items_data)
        return sum + (Array.isArray(items) ? items.length : 0)
      } catch {
        return sum
      }
    }, 0)

    const avgCheck = count > 0 ? totalAmount / count : 0
    const start = startOfDay
    const end = new Date()

    const stats = {
      start,
      end,
      totalAmount,
      cashAmount,
      terminalAmount,
      count,
      totalItems,
      avgCheck,
    }

    console.log("✅ Calculated shift stats:", stats)
    return stats
  }

  if (!isAuthenticated) return <LoginPage />

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
                {workingHours || 0} год. {workingMinutes || 0} хв.
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
            className="h-24 text-lg font-medium rounded-xl relative flex flex-col items-center justify-center gap-2"
            disabled={!isOnline || !isShiftActive || isCreatingVisit}
          >
            <div className="text-2xl">💰</div>
            <span>{isCreatingVisit ? "Створення..." : "Продати"}</span>
            {isShiftActive && !isCreatingVisit && (
              <Badge className="absolute top-2 right-2 bg-green-500">Активно</Badge>
            )}
            {!isOnline && <Badge className="absolute top-2 right-2 bg-red-500 text-xs">Офлайн</Badge>}
            {isCreatingVisit && <Badge className="absolute top-2 right-2 bg-orange-500 text-xs">Створення</Badge>}
          </Button>

          <Button
            onClick={handleFindProduct}
            className="h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
          >
            <Search className="h-6 w-6" />
            <span>Знайти товар</span>
          </Button>

          <Button
            onClick={handleSalesHistory}
            className="h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
          >
            <History className="h-6 w-6" />
            <span>Історія продажів</span>
          </Button>

          {currentUser?.role === "owner" && (
            <>
              <Button
                onClick={handleAddProduct}
                className="h-24 text-lg font-medium rounded-xl relative flex flex-col items-center justify-center gap-2"
                disabled={!isOnline}
              >
                <Package className="h-6 w-6" />
                <span>Внести товар</span>
                {!isOnline && <Badge className="absolute top-2 right-2 bg-red-500 text-xs">Офлайн</Badge>}
              </Button>

              <Button
                onClick={handleAdminPanel}
                variant="purple"
                className="h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
                disabled={!isOnline}
              >
                <BarChart3 className="h-6 w-6" />
                <span>Адмін панель</span>
              </Button>

              <Button
                onClick={handleUsersManagement}
                className="h-24 text-lg font-medium rounded-xl flex flex-col items-center justify-center gap-2"
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
                        <div className="text-2xl font-bold text-green-400">
                          {(visit.sale_amount || 0).toLocaleString()} ₴
                        </div>
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
                    {workingHours || 0}г {workingMinutes || 0}хв
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
                          <span>{(item.price || 0).toLocaleString()} ₴</span>
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
