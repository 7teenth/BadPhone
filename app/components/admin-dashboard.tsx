"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import { useApp } from "../context/app-context"

interface AdminDashboardProps {
  onBack: () => void
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { getDailySalesStats, getTotalStats } = useApp()
  const [selectedPeriod, setSelectedPeriod] = useState("7days")

  const dailyStats = getDailySalesStats()
  const totalStats = getTotalStats()

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + " ₴"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getTopSellers = () => {
    const sellerStats: { [sellerId: string]: { name: string; amount: number; salesCount: number } } = {}

    dailyStats.forEach((day) => {
      Object.entries(day.sellers).forEach(([sellerId, seller]) => {
        if (!sellerStats[sellerId]) {
          sellerStats[sellerId] = { name: seller.name, amount: 0, salesCount: 0 }
        }
        sellerStats[sellerId].amount += seller.amount
        sellerStats[sellerId].salesCount += seller.salesCount
      })
    })

    return Object.entries(sellerStats)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.amount - a.amount)
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
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Загальний дохід</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">За весь період</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всього продажів</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalStats.totalSales}</div>
              <p className="text-xs text-muted-foreground">Кількість транзакцій</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Середній чек</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalStats.averageSale)}</div>
              <p className="text-xs text-muted-foreground">На одну покупку</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Найкращий день</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalStats.topSellingAmount)}</div>
              <p className="text-xs text-muted-foreground">{totalStats.topSellingDay}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Готівка</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalStats.cashAmount)}</div>
              <p className="text-xs text-muted-foreground">Готівкові розрахунки</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Термінал</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalStats.terminalAmount)}</div>
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dailyStats.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Немає даних про продажі</p>
                  ) : (
                    dailyStats.map((day, index) => (
                      <div key={day.date} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h3 className="font-medium">{formatDate(day.date)}</h3>
                            <p className="text-sm text-gray-600">{day.salesCount} продажів</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">{formatCurrency(day.totalAmount)}</div>
                            <div className="text-sm text-gray-600">
                              Середній чек: {formatCurrency(Math.round(day.totalAmount / day.salesCount))}
                            </div>
                          </div>
                        </div>

                        {/* Sellers for this day */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Продавці:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {Object.entries(day.sellers).map(([sellerId, seller]) => (
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSellers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Немає даних про продавців</p>
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
                            Середній чек: {formatCurrency(Math.round(seller.amount / seller.salesCount))}
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
                <div className="space-y-4">
                  {/* Здесь можно добавить более детальную историю продаж */}
                  <p className="text-center text-gray-500 py-8">
                    Детальна історія продажів буде доступна в окремому розділі
                  </p>
                </div>
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
                    {topSellers.slice(0, 5).map((seller, index) => {
                      const percentage = Math.round((seller.amount / totalStats.totalRevenue) * 100)
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
                          {dailyStats.length > 0 ? Math.round(totalStats.totalRevenue / dailyStats.length) : 0}₴
                        </div>
                        <div className="text-sm text-gray-600">Середній дохід на день</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {dailyStats.length > 0 ? Math.round(totalStats.totalSales / dailyStats.length) : 0}
                        </div>
                        <div className="text-sm text-gray-600">Середня к-сть продажів</div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded">
                      <div className="text-lg font-medium text-gray-700">Активних днів: {dailyStats.length}</div>
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
