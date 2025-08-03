"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  Calendar,
  DollarSign,
  BarChart3,
  PieChart,
  Store,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { useApp } from "../context/app-context"

interface AdminDashboardProps {
  onBack: () => void
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { sales, users, stores, products, getDailySalesStats, getTotalStats, currentUser } = useApp()
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedStore, setSelectedStore] = useState("all")
  const [activeTab, setActiveTab] = useState("overview")

  // Фильтрация данных по периоду
  const getFilteredData = () => {
    const now = new Date()
    let startDate: Date

    switch (selectedPeriod) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(0)
    }

    return sales.filter((sale) => {
      const saleDate = new Date(sale.created_at)
      const matchesPeriod = saleDate >= startDate
      const matchesStore = selectedStore === "all" || sale.store_id === selectedStore
      return matchesPeriod && matchesStore
    })
  }

  const filteredSales = getFilteredData()
  const dailyStats = getDailySalesStats()
  const totalStats = getTotalStats()

  // Статистика по магазинам
  const getStoreStats = () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    return stores.map((store) => {
      const storeSales = sales.filter((sale) => sale.store_id === store.id)
      const todaySales = storeSales.filter((sale) => new Date(sale.created_at) >= startOfDay)
      const storeUsers = users.filter((user) => user.store_id === store.id)

      const activeUsers = storeUsers.filter((user) => {
        // Проверяем, есть ли продажи пользователя сегодня
        return todaySales.some((sale) => sale.seller_id === user.id)
      })

      const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0)
      const lastActivity =
        storeSales.length > 0 ? new Date(Math.max(...storeSales.map((s) => new Date(s.created_at).getTime()))) : null

      return {
        store,
        todaySales: todaySales.length,
        todayRevenue,
        totalUsers: storeUsers.length,
        activeUsers: activeUsers.length,
        lastActivity,
        isActive: todaySales.length > 0 || activeUsers.length > 0,
      }
    })
  }

  const storeStats = getStoreStats()

  // Топ продавцов
  const getTopSellers = () => {
    const sellerStats: { [key: string]: { name: string; sales: number; revenue: number } } = {}

    filteredSales.forEach((sale) => {
      if (sale.seller) {
        const sellerId = sale.seller.id
        if (!sellerStats[sellerId]) {
          sellerStats[sellerId] = { name: sale.seller.name, sales: 0, revenue: 0 }
        }
        sellerStats[sellerId].sales += 1
        sellerStats[sellerId].revenue += sale.total_amount
      }
    })

    return Object.values(sellerStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  // Топ товары
  const getTopProducts = () => {
    const productStats: { [key: string]: { name: string; quantity: number; revenue: number } } = {}

    filteredSales.forEach((sale) => {
      sale.items_data.forEach((item: any) => {
        const productName = item.product_name || item.name || "Невідомий товар"
        const quantity = item.quantity || 1
        const revenue = (item.price || 0) * quantity

        if (!productStats[productName]) {
          productStats[productName] = { name: productName, quantity: 0, revenue: 0 }
        }
        productStats[productName].quantity += quantity
        productStats[productName].revenue += revenue
      })
    })

    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  const topSellers = getTopSellers()
  const topProducts = getTopProducts()

  // Основная статистика
  const mainStats = {
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0),
    totalSales: filteredSales.length,
    averageCheck:
      filteredSales.length > 0
        ? filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0) / filteredSales.length
        : 0,
    totalProducts: products.length,
    totalUsers: users.length,
    totalStores: stores.length,
  }

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "today":
        return "Сьогодні"
      case "week":
        return "За тиждень"
      case "month":
        return "За місяць"
      case "year":
        return "За рік"
      default:
        return "За весь час"
    }
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Адміністративна панель</h1>
          <Badge variant="secondary" className="bg-gray-700 text-white">
            {getPeriodLabel()}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Сьогодні</SelectItem>
              <SelectItem value="week">За тиждень</SelectItem>
              <SelectItem value="month">За місяць</SelectItem>
              <SelectItem value="year">За рік</SelectItem>
              <SelectItem value="all">За весь час</SelectItem>
            </SelectContent>
          </Select>
          {currentUser?.role === "owner" && (
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі магазини</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{mainStats.totalRevenue.toLocaleString()} ₴</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <DollarSign className="h-4 w-4" />
                Виручка
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{mainStats.totalSales}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                Продажів
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{mainStats.averageCheck.toFixed(0)} ₴</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Середній чек
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{mainStats.totalProducts}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Package className="h-4 w-4" />
                Товарів
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{mainStats.totalUsers}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                Користувачів
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-teal-600">{mainStats.totalStores}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Store className="h-4 w-4" />
                Магазинів
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Огляд
            </TabsTrigger>
            <TabsTrigger value="stores" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Статус магазинів
            </TabsTrigger>
            <TabsTrigger value="sellers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Продавці
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Товари
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Продажі по днях
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyStats.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Немає даних про продажі</p>
                  ) : (
                    <div className="space-y-4">
                      {dailyStats.slice(0, 7).map((stat) => (
                        <div key={stat.date} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">
                              {new Date(stat.date).toLocaleDateString("uk-UA", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                            <div className="text-sm text-gray-600">{stat.salesCount} продажів</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">{stat.totalAmount.toLocaleString()} ₴</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Способи оплати
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Готівка</span>
                        <span>{totalStats.cashAmount.toLocaleString()} ₴</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{
                            width: `${
                              totalStats.totalRevenue > 0 ? (totalStats.cashAmount / totalStats.totalRevenue) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Термінал</span>
                        <span>{totalStats.terminalAmount.toLocaleString()} ₴</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${
                              totalStats.totalRevenue > 0
                                ? (totalStats.terminalAmount / totalStats.totalRevenue) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Статус магазинів
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {storeStats.map((storeStat) => (
                    <div key={storeStat.store.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {storeStat.isActive ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h3 className="font-medium">{storeStat.store.name}</h3>
                            <p className="text-sm text-gray-600">{storeStat.isActive ? "Працює" : "Неактивний"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">{storeStat.todaySales}</div>
                          <div className="text-xs text-gray-600">Продажі сьогодні</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {storeStat.todayRevenue.toLocaleString()} ₴
                          </div>
                          <div className="text-xs text-gray-600">Виручка сьогодні</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-600">{storeStat.activeUsers}</div>
                          <div className="text-xs text-gray-600">Активні продавці</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-orange-600">{storeStat.totalUsers}</div>
                          <div className="text-xs text-gray-600">Всього продавців</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {storeStat.lastActivity && (
                          <div className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {storeStat.lastActivity.toLocaleDateString("uk-UA")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sellers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Топ продавців
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topSellers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Немає даних про продавців</p>
                ) : (
                  <div className="space-y-4">
                    {topSellers.map((seller, index) => (
                      <div key={seller.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{seller.name}</h4>
                            <p className="text-sm text-gray-600">{seller.sales} продажів</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{seller.revenue.toLocaleString()} ₴</div>
                          <div className="text-sm text-gray-600">
                            {seller.sales > 0 ? (seller.revenue / seller.sales).toFixed(0) : 0} ₴ сер. чек
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Топ товарів за дохідністю
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Немає даних про товари</p>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-600">{product.quantity} шт продано</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{product.revenue.toLocaleString()} ₴</div>
                          <div className="text-sm text-gray-600">
                            {product.quantity > 0 ? (product.revenue / product.quantity).toFixed(0) : 0} ₴ за шт
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
