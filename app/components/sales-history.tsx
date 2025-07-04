"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Receipt, Calendar, CreditCard, Banknote, Filter } from "lucide-react"
import { useApp } from "../context/app-context"

interface SalesHistoryProps {
  onBack: () => void
}

export function SalesHistory({ onBack }: SalesHistoryProps) {
  const { sales, currentUser } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")

  // Фильтруем только продажи за сегодня
  const todayString = new Date().toDateString()

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.created_at)
    const isToday = saleDate.toDateString() === todayString

    if (!isToday) return false

    const matchesSearch =
      sale.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.seller?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items_data.some((item: any) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesPayment = paymentFilter === "all" || sale.payment_method === paymentFilter

    return matchesSearch && matchesPayment
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTotalStats = () => {
    const total = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const cashTotal = filteredSales
      .filter((s) => s.payment_method === "cash")
      .reduce((sum, sale) => sum + sale.total_amount, 0)
    const terminalTotal = filteredSales
      .filter((s) => s.payment_method === "terminal")
      .reduce((sum, sale) => sum + sale.total_amount, 0)

    return { total, cashTotal, terminalTotal, count: filteredSales.length }
  }

  const stats = getTotalStats()

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Історія продажів (Сьогодні)</h1>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Пошук за чеком, продавцем, товаром..."
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

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setPaymentFilter("all")
                }}
                className="bg-transparent"
              >
                <Filter className="h-4 w-4 mr-2" />
                Скинути
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.total.toLocaleString()} ₴</div>
              <div className="text-sm text-gray-600">Загальна сума</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.count}</div>
              <div className="text-sm text-gray-600">Кількість продажів</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.cashTotal.toLocaleString()} ₴</div>
              <div className="text-sm text-gray-600">Готівка</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.terminalTotal.toLocaleString()} ₴</div>
              <div className="text-sm text-gray-600">Термінал</div>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        <div className="space-y-4">
          {filteredSales.length === 0 ? (
            <Card className="p-12 text-center">
              <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">Продажі не знайдено</h3>
              <p className="text-gray-500">Спробуйте змінити критерії пошуку</p>
            </Card>
          ) : (
            filteredSales.map((sale) => (
              <Card key={sale.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="h-4 w-4 text-gray-600" />
                        <span className="font-mono text-sm">{sale.receipt_number}</span>
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
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(sale.created_at)}</span>
                        {sale.seller && (
                          <>
                            <span>•</span>
                            <span>{sale.seller.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{sale.total_amount.toLocaleString()} ₴</div>
                      <div className="text-sm text-gray-600">
                        {sale.items_data.reduce((sum: number, item: any) => sum + item.cartQuantity, 0)} товарів
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Товари:</h4>
                    <div className="space-y-1">
                      {sale.items_data.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.name} ({item.brand} {item.model})
                          </span>
                          <span className="text-gray-600">
                            {item.cartQuantity} × {item.price} ₴ = {(item.cartQuantity * item.price).toLocaleString()} ₴
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
