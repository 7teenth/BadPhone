"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Receipt,
  Banknote,
  CreditCard,
  Store,
} from "lucide-react"
import { useApp } from "../context/app-context"

interface AdminDashboardProps {
  onBack: () => void
}

interface SellerStats {
  name: string
  amount: number
  salesCount: number
}

interface DailyStat {
  date: string
  salesCount: number
  totalAmount: number
  sellers: { [sellerId: string]: SellerStats }
}

interface TotalStats {
  totalRevenue: number
  totalSales: number
  averageSale: number
  topSellingAmount: number
  topSellingDay: string
  cashAmount: number
  terminalAmount: number
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { getDailySalesStats, getTotalStats, stores, currentUser, sales } = useApp()
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all")

  // ✅ ДОБАВЛЯЕМ: Фильтрацию данных по магазинам
  const [filteredDailyStats, setFilteredDailyStats] = useState<DailyStat[]>([])
  const [filteredTotalStats, setFilteredTotalStats] = useState<TotalStats>({
    totalRevenue: 0,
    totalSales: 0,
    averageSale: 0,
    topSellingAmount: 0,
    topSellingDay: "",
    cashAmount: 0,
    terminalAmount: 0,
  })

  // Получаем все данные
  const allDailyStats: DailyStat[] = getDailySalesStats() || []
  const allTotalStats: TotalStats = getTotalStats() || {
    totalRevenue: 0,
    totalSales: 0,
    averageSale: 0,
    topSellingAmount: 0,
    topSellingDay: "",
    cashAmount: 0,
    terminalAmount: 0,
  }

  // ✅ ИСПРАВЛЕНИЕ: Фильтрация данных по магазинам из БД
  useEffect(() => {
    console.log("🔍 Filtering data for store:", selectedStoreId)
    console.log("📊 Available sales:", sales.length)
    console.log("🏪 Available stores:", stores.length)

    if (selectedStoreId === "all") {
      setFilteredDailyStats(allDailyStats)
      setFilteredTotalStats(allTotalStats)
    } else {
      // Фильтруем продажи по выбранному магазину
      const filteredSales = sales.filter((sale) => sale.store_id === selectedStoreId)
      console.log("🎯 Filtered sales for store:", filteredSales.length)

      // Пересчитываем статистику для отфильтрованных продаж
      const filteredStats = calculateStatsForSales(filteredSales)
      setFilteredDailyStats(filteredStats.dailyStats)
      setFilteredTotalStats(filteredStats.totalStats)
    }
  }, [selectedStoreId, allDailyStats, allTotalStats, sales])

  // ✅ ДОБАВЛЯЕМ: Функция для расчета статистики по отфильтрованным продажам
  const calculateStatsForSales = (salesData: any[]) => {
    if (!salesData || salesData.length === 0) {
      return {
        dailyStats: [],
        totalStats: {
          totalRevenue: 0,
          totalSales: 0,
          averageSale: 0,
          topSellingAmount: 0,
          topSellingDay: "",
          cashAmount: 0,
          terminalAmount: 0,
        },
      }
    }

    // Группируем по дням
    const statsMap: Record<
      string,
      {
        salesCount: number
        totalAmount: number
        sellers: { [sellerId: string]: { name: string; amount: number; salesCount: number } }
      }
    > = {}

    salesData.forEach((sale) => {
      const date = new Date(sale.created_at).toISOString().split("T")[0]
      if (!statsMap[date]) {
        statsMap[date] = { salesCount: 0, totalAmount: 0, sellers: {} }
      }
      statsMap[date].salesCount += 1
      statsMap[date].totalAmount += sale.total_amount

      if (sale.seller) {
        const sellerId = sale.seller.id
        if (!statsMap[date].sellers[sellerId]) {
          statsMap[date].sellers[sellerId] = {
            name: sale.seller.name,
            amount: 0,
            salesCount: 0,
          }
        }
        statsMap[date].sellers[sellerId].amount += sale.total_amount
        statsMap[date].sellers[sellerId].salesCount += 1
      }
    })

    const dailyStats = Object.entries(statsMap)
      .map(([date, stats]) => ({
        date,
        salesCount: stats.salesCount,
        totalAmount: stats.totalAmount,
        sellers: stats.sellers,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Общая статистика
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total_amount, 0)
    const totalSales = salesData.length
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0

    // Найти самый прибыльный день
    const dateStats: Record<string, number> = {}
    salesData.forEach((sale) => {
      const date = new Date(sale.created_at).toISOString().split("T")[0]
      dateStats[date] = (dateStats[date] || 0) + sale.total_amount
    })

    let topSellingAmount = 0
    let topSellingDay = ""
    Object.entries(dateStats).forEach(([date, amount]) => {
      if (amount > topSellingAmount) {
        topSellingAmount = amount
        topSellingDay = date
      }
    })

    const cashAmount = salesData.filter((s) => s.payment_method === "cash").reduce((sum, s) => sum + s.total_amount, 0)
    const terminalAmount = salesData
      .filter((s) => s.payment_method === "terminal")
      .reduce((sum, s) => sum + s.total_amount, 0)

    return {
      dailyStats,
      totalStats: {
        totalRevenue,
        totalSales,
        averageSale,
        topSellingAmount,
        topSellingDay,
        cashAmount,
        terminalAmount,
      },
    }
  }

  // Логирование для диагностики
  useEffect(() => {
    console.log("AdminDashboard: filteredDailyStats", filteredDailyStats)
    console.log("AdminDashboard: filteredTotalStats", filteredTotalStats)
    console.log("AdminDashboard: selectedStoreId", selectedStoreId)
    console.log("AdminDashboard: stores", stores)
  }, [filteredDailyStats, filteredTotalStats, selectedStoreId, stores])

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "—"
    return amount.toLocaleString("uk-UA") + " ₴"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "—"

    try {
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split("-")
        return `${day}.${month}.${year}`
      }

      if (dateString.includes(".")) {
        return dateString
      }

      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "—"

      return date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error, "for dateString:", dateString)
      return "—"
    }
  }

  const getTopSellers = () => {
    const sellerStats: { [sellerId: string]: SellerStats } = {}
    filteredDailyStats.forEach((day) => {
      if (!day.sellers) return
      Object.entries(day.sellers).forEach(([sellerId, seller]) => {
        if (!sellerStats[sellerId]) {
          sellerStats[sellerId] = { name: seller.name, amount: 0, salesCount: 0 }
        }
        sellerStats[sellerId].amount += seller.amount
        sellerStats[sellerId].salesCount += seller.salesCount
      })
    })

    const sortedSellers = Object.entries(sellerStats)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.amount - a.amount)

    console.log("AdminDashboard: topSellers", sortedSellers)
    return sortedSellers
  }

  const topSellers = getTopSellers()

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Адміністративна панель</h1>
        <Badge className="bg-yellow-600 text-black">Тільки власник</Badge>
      </header>

      <div className="p-6 space-y-6">
        {/* ✅ ИСПРАВЛЕНИЕ: Фильтр по магазинам из БД */}
        {currentUser?.role === "owner" && stores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Фільтр по магазинах
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Оберіть магазин" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі магазини ({stores.length})</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                      {store.address && <span className="text-gray-500 ml-2">({store.address})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-2">
                {selectedStoreId === "all"
                  ? `Показано дані по всіх ${stores.length} магазинах`
                  : `Показано дані по магазину: ${stores.find((s) => s.id === selectedStoreId)?.name || "Невідомий"}`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Загальний дохід</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(filteredTotalStats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {selectedStoreId === "all" ? "За весь період" : "Обраний магазин"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всього продажів</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{filteredTotalStats.totalSales}</div>
              <p className="text-xs text-muted-foreground">Кількість транзакцій</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Середній чек</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(filteredTotalStats.averageSale)}</div>
              <p className="text-xs text-muted-foreground">На одну покупку</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Найкращий день</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(filteredTotalStats.topSellingAmount)}
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(filteredTotalStats.topSellingDay)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Готівка</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(filteredTotalStats.cashAmount)}</div>
              <p className="text-xs text-muted-foreground">Готівкові розрахунки</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Термінал</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(filteredTotalStats.terminalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">Безготівкові розрахунки</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">Продажі по днях</TabsTrigger>
            <TabsTrigger value="sellers">Топ продавців</TabsTrigger>
            <TabsTrigger value="sales-history">Історія продажів</TabsTrigger>
            <TabsTrigger value="analytics">Аналітика</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Продажі по днях
                  {selectedStoreId !== "all" && (
                    <Badge variant="outline">
                      {stores.find((s) => s.id === selectedStoreId)?.name || "Обраний магазин"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredDailyStats.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {selectedStoreId === "all" ? "Немає даних про продажі" : "Немає продажів для обраного магазину"}
                    </p>
                  ) : (
                    filteredDailyStats.map((day) => (
                      <div key={day.date} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h3 className="font-medium">{formatDate(day.date)}</h3>
                            <p className="text-sm text-gray-600">{day.salesCount} продажів</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">{formatCurrency(day.totalAmount)}</div>
                            <div className="text-sm text-gray-600">
                              Середній чек:{" "}
                              {day.salesCount > 0 ? formatCurrency(Math.round(day.totalAmount / day.salesCount)) : "—"}
                            </div>
                          </div>
                        </div>
                        {/* Sellers for this day */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Продавці:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {day.sellers &&
                              Object.entries(day.sellers).map(([sellerId, seller]) => (
                                <div key={sellerId} className="bg-gray-50 rounded p-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{seller.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {seller.salesCount} продажів
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-green-600 font-medium">
                                    {formatCurrency(seller.amount)}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sellers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Рейтинг продавців
                  {selectedStoreId !== "all" && (
                    <Badge variant="outline">
                      {stores.find((s) => s.id === selectedStoreId)?.name || "Обраний магазин"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSellers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {selectedStoreId === "all"
                        ? "Немає даних про продавців"
                        : "Немає продавців для обраного магазину"}
                    </p>
                  ) : (
                    topSellers.map((seller, index) => (
                      <div key={seller.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium">{seller.name}</h3>
                            <p className="text-sm text-gray-600">{seller.salesCount} продажів</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">{formatCurrency(seller.amount)}</div>
                          <div className="text-sm text-gray-600">
                            Середній чек:{" "}
                            {seller.salesCount > 0
                              ? formatCurrency(Math.round(seller.amount / seller.salesCount))
                              : "—"}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales-history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Детальна історія продажів
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">
                  Детальна історія продажів буде доступна в окремому розділі
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Розподіл продажів
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topSellers.slice(0, 5).map((seller) => {
                      const percentage =
                        filteredTotalStats.totalRevenue > 0
                          ? Math.round((seller.amount / filteredTotalStats.totalRevenue) * 100)
                          : 0
                      return (
                        <div key={seller.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{seller.name}</span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-black h-2 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Тенденції продажів
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {filteredDailyStats.length > 0
                            ? Math.round(filteredTotalStats.totalRevenue / filteredDailyStats.length)
                            : 0}
                          ₴
                        </div>
                        <div className="text-sm text-gray-600">Середній дохід на день</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {filteredDailyStats.length > 0
                            ? Math.round(filteredTotalStats.totalSales / filteredDailyStats.length)
                            : 0}
                        </div>
                        <div className="text-sm text-gray-600">Середня к-сть продажів</div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <div className="text-lg font-medium text-gray-700">
                        Активних днів: {filteredDailyStats.length}
                      </div>
                      <div className="text-sm text-gray-600">Загальна кількість робочих днів з продажами</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
