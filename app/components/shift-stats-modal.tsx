"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BarChart3, Clock, Banknote, CreditCard, TrendingUp, Package, X, Share2 } from "lucide-react"

interface ShiftStatsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmEnd: () => void
  shiftStats: {
    start: Date
    end: Date
    totalAmount: number
    cashAmount: number
    terminalAmount: number
    count: number
    totalItems: number
    avgCheck: number
  } | null
  workingHours: number
  workingMinutes: number
  sellerName: string
  storeName: string
}

export function ShiftStatsModal({
  isOpen,
  onClose,
  onConfirmEnd,
  shiftStats,
  workingHours,
  workingMinutes,
  sellerName,
  storeName,
}: ShiftStatsModalProps) {
  if (!isOpen || !shiftStats) return null

  const hourlyEarnings = workingHours > 0 ? shiftStats.totalAmount / workingHours : 0
  const totalWorkingMinutes = workingHours * 60 + workingMinutes
  const avgTimePerSale = shiftStats.count > 0 ? totalWorkingMinutes / shiftStats.count : 0

  const handleExport = () => {
    const statsText = `
📊 СТАТИСТИКА ЗМІНИ
🏪 Магазин: ${storeName}
👤 Продавець: ${sellerName}
📅 Дата: ${shiftStats.start.toLocaleDateString("uk-UA")}
⏰ Час: ${shiftStats.start.toLocaleTimeString("uk-UA")} - ${shiftStats.end.toLocaleTimeString("uk-UA")}
🕐 Тривалість: ${workingHours} год. ${workingMinutes} хв.

💰 ФІНАНСОВІ ПОКАЗНИКИ:
• Загальна сума: ${shiftStats.totalAmount.toLocaleString()} ₴
• Готівка: ${shiftStats.cashAmount.toLocaleString()} ₴
• Термінал: ${shiftStats.terminalAmount.toLocaleString()} ₴
• Середній чек: ${shiftStats.avgCheck.toFixed(0)} ₴
• Заробіток за годину: ${hourlyEarnings.toFixed(0)} ₴/год

📦 ОПЕРАЦІЙНІ ПОКАЗНИКИ:
• Кількість продажів: ${shiftStats.count}
• Загальна кількість товарів: ${shiftStats.totalItems}
• Середній час на продаж: ${avgTimePerSale.toFixed(1)} хв
• Товарів за годину: ${workingHours > 0 ? (shiftStats.totalItems / workingHours).toFixed(1) : 0}

Дякуємо за роботу! 🙏
    `.trim()

    if (navigator.share) {
      navigator.share({
        title: `Статистика зміни - ${sellerName}`,
        text: statsText,
      })
    } else {
      navigator.clipboard.writeText(statsText)
      alert("Статистику скопійовано в буфер обміну!")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <CardTitle>Статистика зміни</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Shift Info */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Продавець:</div>
                <div className="font-medium">{sellerName}</div>
              </div>
              <div>
                <div className="text-gray-600">Магазин:</div>
                <div className="font-medium">{storeName}</div>
              </div>
              <div>
                <div className="text-gray-600">Початок зміни:</div>
                <div className="font-medium">{shiftStats.start.toLocaleString("uk-UA")}</div>
              </div>
              <div>
                <div className="text-gray-600">Тривалість:</div>
                <div className="font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {workingHours} год. {workingMinutes} хв.
                </div>
              </div>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Фінансові показники
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{shiftStats.totalAmount.toLocaleString()} ₴</div>
                <div className="text-sm text-gray-600">Загальна сума</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{shiftStats.count}</div>
                <div className="text-sm text-gray-600">Продажів</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{shiftStats.avgCheck.toFixed(0)} ₴</div>
                <div className="text-sm text-gray-600">Середній чек</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{hourlyEarnings.toFixed(0)} ₴</div>
                <div className="text-sm text-gray-600">За годину</div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Способи оплати</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Готівка</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600">{shiftStats.cashAmount.toLocaleString()} ₴</div>
                  <div className="text-xs text-gray-600">
                    {((shiftStats.cashAmount / shiftStats.totalAmount) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium">Термінал</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-indigo-600">{shiftStats.terminalAmount.toLocaleString()} ₴</div>
                  <div className="text-xs text-gray-600">
                    {((shiftStats.terminalAmount / shiftStats.totalAmount) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Stats */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Операційні показники
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-700">{shiftStats.totalItems}</div>
                <div className="text-sm text-gray-600">Товарів продано</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-700">{avgTimePerSale.toFixed(1)} хв</div>
                <div className="text-sm text-gray-600">На продаж</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-700">
                  {workingHours > 0 ? (shiftStats.totalItems / workingHours).toFixed(1) : 0}
                </div>
                <div className="text-sm text-gray-600">Товарів/год</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1 bg-transparent">
              <Share2 className="h-4 w-4 mr-2" />
              Поділитися
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Продовжити
            </Button>
            <Button variant="destructive" onClick={onConfirmEnd} className="flex-1">
              Завершити зміну
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">Дякуємо за продуктивну роботу! 🎉</div>
        </CardContent>
      </Card>
    </div>
  )
}
