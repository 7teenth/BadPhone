"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Receipt, Printer, Share2, X, Store, User, Clock, Banknote, CreditCard } from "lucide-react"
import type { SaleItem } from "@/lib/types"

interface SaleReceiptProps {
  isOpen: boolean
  onClose: () => void
  receiptData: {
    receiptNumber: string
    items: SaleItem[]
    totalAmount: number
    discountAmount?: number
    finalAmount: number
    paymentMethod: "cash" | "terminal"
    storeName: string
    sellerName: string
    timestamp: string
  }
}

export function SaleReceipt({ isOpen, onClose, receiptData }: SaleReceiptProps) {
  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    const receiptText = `
🧾 ЧЕК №${receiptData.receiptNumber}
🏪 ${receiptData.storeName}
👤 Продавець: ${receiptData.sellerName}
📅 ${new Date(receiptData.timestamp).toLocaleString("uk-UA")}

📦 ТОВАРИ:
${receiptData.items
  .map(
    (item) =>
      `${item.product_name} (${item.brand} ${item.model})
${item.quantity} шт × ${item.price.toLocaleString()} ₴ = ${(item.quantity * item.price).toLocaleString()} ₴`,
  )
  .join("\n")}

💰 ПІДСУМОК:
Сума товарів: ${receiptData.totalAmount.toLocaleString()} ₴
${receiptData.discountAmount ? `Знижка: -${receiptData.discountAmount.toLocaleString()} ₴` : ""}
ДО СПЛАТИ: ${receiptData.finalAmount.toLocaleString()} ₴
Спосіб оплати: ${receiptData.paymentMethod === "cash" ? "Готівка" : "Термінал"}

Дякуємо за покупку! 🙏
    `.trim()

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Чек №${receiptData.receiptNumber}`,
          text: receiptText,
        })
      } catch (error) {
        console.log("Sharing cancelled")
      }
    } else {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(receiptText)
        alert("Чек скопійовано в буфер обміну!")
      } catch (error) {
        console.error("Failed to copy receipt:", error)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-6 w-6 text-green-600" />
              <CardTitle className="text-xl">Чек продажу</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600">№ {receiptData.receiptNumber}</div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Store and Seller Info */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Store className="h-4 w-4 text-gray-600" />
              <span className="font-medium">{receiptData.storeName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-600" />
              <span>Продавець: {receiptData.sellerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-600" />
              <span>{new Date(receiptData.timestamp).toLocaleString("uk-UA")}</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Товари:</h3>
            {receiptData.items.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.product_name}</div>
                    <div className="text-xs text-gray-600">
                      {item.brand} {item.model}
                    </div>
                  </div>
                  <div className="text-sm font-medium ml-2">{(item.quantity * item.price).toLocaleString()} ₴</div>
                </div>
                <div className="text-xs text-gray-500">
                  {item.quantity} шт × {item.price.toLocaleString()} ₴
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Сума товарів:</span>
              <span>{receiptData.totalAmount.toLocaleString()} ₴</span>
            </div>
            {receiptData.discountAmount && receiptData.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Знижка:</span>
                <span>-{receiptData.discountAmount.toLocaleString()} ₴</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>ДО СПЛАТИ:</span>
              <span className="text-green-600">{receiptData.finalAmount.toLocaleString()} ₴</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              {receiptData.paymentMethod === "cash" ? (
                <>
                  <Banknote className="h-4 w-4" />
                  <span>Готівка</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Термінал</span>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline" className="flex-1 bg-transparent">
              <Printer className="h-4 w-4 mr-2" />
              Друк
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 bg-transparent">
              <Share2 className="h-4 w-4 mr-2" />
              Поділитися
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 pt-2">Дякуємо за покупку! 🙏</div>
        </CardContent>
      </Card>
    </div>
  )
}
