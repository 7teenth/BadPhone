"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Search,
  Calendar,
  DollarSign,
  ShoppingCart,
  User,
  Receipt,
  Filter,
  Download,
  Eye,
  Banknote,
  CreditCard,
  Package,
  TrendingUp,
  BarChart3,
  Info,
} from "lucide-react"
import { useApp } from "../context/app-context"

interface SalesHistoryProps {
  onBack: () => void
}

export function SalesHistory({ onBack }: SalesHistoryProps) {
  const { sales, users, stores, currentUser } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [sellerFilter, setSellerFilter] = useState("all")
  const [storeFilter, setStoreFilter] = useState("all")
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("list")

  // Для продавцов показываем только продажи за сегодня
  const filteredSales = useMemo(() => {
    let salesData = sales

    // Если пользователь - продавец, фильтруем только его продажи за сегодня
    if (currentUser?.role === "seller") {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      salesData = sales.filter((sale) => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= startOfDay && sale.seller_id === currentUser.id
      })
    }

    return salesData.filter((sale) => {
      const matchesSearch =
        sale.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.seller?.name || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchesPayment = paymentFilter === "all" || sale.payment_method === paymentFilter
      const matchesSeller = sellerFilter === "all" || sale.seller_id === sellerFilter
      const matchesStore = storeFilter === "all" || sale.store_id === storeFilter

      return matchesSearch && matchesPayment && matchesSeller && matchesStore
    })
  }, [sales, searchTerm, paymentFilter, sellerFilter, storeFilter, currentUser])

  const getSalesStats = () => {
    const total = filteredSales.length
    const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const averageCheck = total > 0 ? totalAmount / total : 0
    const cashAmount = filteredSales
      .filter((s) => s.payment_method === "cash")
      .reduce((sum, s) => sum + s.total_amount, 0)
    const terminalAmount = filteredSales
      .filter((s) => s.payment_method === "terminal")
      .reduce((sum, s) => sum + s.total_amount, 0)

    return { total, totalAmount, averageCheck, cashAmount, terminalAmount }
  }

  const stats = getSalesStats()

  const handleViewSale = (sale: any) => {
    setSelectedSale(sale)
  }

  const closeSaleModal = () => {
    setSelectedSale(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Історія продажів</h1>
          <Badge variant="secondary" className="bg-gray-700 text-white">
            {filteredSales.length} продажів
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black">
            <Download className="h-4 w-4 mr-2" />
            Експорт
          </Button>
        </div>
      </header>

      {/* Информация для продавцов */}
      {currentUser?.role === "seller" && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center gap-2 text-blue-800">
            <Info className="h-4 w-4" />
            <span className="text-sm">Показано продажі за сьогодні для вашого облікового запису</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Filters - только для владельцев */}
        {currentUser?.role === "owner" && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Пошук за чеком або продавцем..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Спосіб оплати" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі способи</SelectItem>
                    <SelectItem value="cash">Готівка</SelectItem>
                    <SelectItem value="terminal">Термінал</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sellerFilter} onValueChange={setSellerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Продавець" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі продавці</SelectItem>
                    {users
                      .filter((user) => user.role === "seller")
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Магазин" />
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

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setPaymentFilter("all")
                    setSellerFilter("all")
                    setStoreFilter("all")
                  }}
                  className="bg-transparent"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Скинути
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                Продажів
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalAmount.toLocaleString()} ₴</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <DollarSign className="h-4 w-4" />
                Загальна сума
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averageCheck.toFixed(0)} ₴</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Середній чек
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.cashAmount.toLocaleString()} ₴</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Banknote className="h-4 w-4" />
                Готівка
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.terminalAmount.toLocaleString()} ₴</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <CreditCard className="h-4 w-4" />
                Термінал
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Список продажів
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Аналітика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {filteredSales.length === 0 ? (
              <Card className="p-12 text-center">
                <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">Продажі не знайдено</h3>
                <p className="text-gray-500">
                  {currentUser?.role === "seller"
                    ? "Сьогодні ще не було продажів"
                    : "Спробуйте змінити критерії пошуку"}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSales.map((sale) => {
                  const store = stores.find((s) => s.id === sale.store_id)

                  return (
                    <Card key={sale.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">Чек #{sale.receipt_number}</h3>
                              <Badge
                                variant={sale.payment_method === "cash" ? "default" : "secondary"}
                                className={sale.payment_method === "cash" ? "bg-orange-600" : "bg-purple-600"}
                              >
                                {sale.payment_method === "cash" ? (
                                  <>
                                    <Banknote className="h-3 w-3 mr-1" />
                                    Готівка
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Термінал
                                  </>
                                )}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-600" />
                                <span>{formatDate(sale.created_at)}</span>
                              </div>
                              {sale.seller && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-600" />
                                  <span>{sale.seller.name}</span>
                                </div>
                              )}
                              {store && (
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-gray-600" />
                                  <span>{store.name}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-sm text-gray-600">Товарів: {sale.items_data?.length || 0} шт</div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-green-600 mb-2">
                              {sale.total_amount.toLocaleString()} ₴
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleViewSale(sale)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Переглянути
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Розподіл за способом оплати
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Готівка</span>
                        <span>{stats.cashAmount.toLocaleString()} ₴</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{
                            width: `${stats.totalAmount > 0 ? (stats.cashAmount / stats.totalAmount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Термінал</span>
                        <span>{stats.terminalAmount.toLocaleString()} ₴</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${stats.totalAmount > 0 ? (stats.terminalAmount / stats.totalAmount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Ключові показники
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium">Найбільший чек</span>
                      <span className="font-bold text-green-600">
                        {filteredSales.length > 0
                          ? Math.max(...filteredSales.map((s) => s.total_amount)).toLocaleString()
                          : 0}{" "}
                        ₴
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium">Найменший чек</span>
                      <span className="font-bold text-blue-600">
                        {filteredSales.length > 0
                          ? Math.min(...filteredSales.map((s) => s.total_amount)).toLocaleString()
                          : 0}{" "}
                        ₴
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="text-sm font-medium">Загальна кількість товарів</span>
                      <span className="font-bold text-purple-600">
                        {filteredSales.reduce((sum, sale) => sum + (sale.items_data?.length || 0), 0)} шт
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Деталі продажу</h3>
                <Button variant="ghost" onClick={closeSaleModal}>
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* Sale Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Інформація про чек</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Номер чеку:</span>
                        <span className="ml-2 font-mono">{selectedSale.receipt_number}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Дата:</span>
                        <span className="ml-2">{formatDate(selectedSale.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Спосіб оплати:</span>
                        <Badge
                          className={`ml-2 ${
                            selectedSale.payment_method === "cash" ? "bg-orange-600" : "bg-purple-600"
                          }`}
                        >
                          {selectedSale.payment_method === "cash" ? "Готівка" : "Термінал"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Продавець та магазин</h4>
                    <div className="space-y-2 text-sm">
                      {selectedSale.seller && (
                        <div>
                          <span className="text-gray-600">Продавець:</span>
                          <span className="ml-2">{selectedSale.seller.name}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Магазин:</span>
                        <span className="ml-2">
                          {stores.find((s) => s.id === selectedSale.store_id)?.name || "Невідомо"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-4">Товари в чеку</h4>
                  {selectedSale.items_data && selectedSale.items_data.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSale.items_data.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h5 className="font-medium">{item.product_name || item.name}</h5>
                            {(item.brand || item.model) && (
                              <p className="text-sm text-gray-600">
                                {item.brand} {item.model}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              {item.price?.toLocaleString()} ₴ × {item.quantity} шт
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">
                              {((item.price || 0) * (item.quantity || 1)).toLocaleString()} ₴
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Інформація про товари відсутня</p>
                  )}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Загальна сума:</span>
                    <span className="text-green-600">{selectedSale.total_amount.toLocaleString()} ₴</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
