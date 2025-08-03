"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Download, Plus, Home } from "lucide-react"

interface SaleItem {
  id: string
  name: string
  brand?: string
  model?: string
  price: number
  cartQuantity: number
}

interface Sale {
  id: string
  receiptNumber: string
  date: Date | string
  items: SaleItem[]
  total: number
  subtotal?: number
  discountAmount?: number
  paymentMethod?: string
}

interface SaleReceiptProps {
  sale: Sale
  onNewSale: () => void
  onBack: () => void
}

export function SaleReceipt({ sale, onNewSale, onBack }: SaleReceiptProps) {
  const handlePrint = () => {
    if (window.print) {
      window.print()
    } else {
      alert("Функція друку не підтримується вашим браузером")
    }
  }
  const handleDownload = () => {
    try {
      // Создаем простой текстовый чек для загрузки
      const receiptText = `
BADPHONE
Магазин мобільних аксесуарів
вул. Хрещатик, 1, Київ
Тел: +380 44 123 45 67

Чек №: ${sale.receiptNumber}
Дата: ${saleDate ? saleDate.toLocaleDateString("uk-UA") : "–"}
Час: ${saleDate ? saleDate.toLocaleTimeString("uk-UA") : "–"}

ТОВАРИ:
${
  sale.items
    ? sale.items
        .map(
          (item) =>
            `${item.name || "Невідомий товар"}
${item.brand || ""} ${item.model || ""}
${item.cartQuantity || 0} шт × ${(item.price || 0).toLocaleString()} ₴ = ${((item.cartQuantity || 0) * (item.price || 0)).toLocaleString()} ₴`,
        )
        .join("\n\n")
    : "Товари відсутні"
}

Кількість товарів: ${sale.items ? sale.items.reduce((sum, item) => sum + (item.cartQuantity || 0), 0) : 0} шт
${sale.subtotal ? `Підсума: ${sale.subtotal.toLocaleString()} ₴` : ""}
${sale.discountAmount && sale.discountAmount > 0 ? `Знижка: -${sale.discountAmount.toLocaleString()} ₴` : ""}
До сплати: ${safeTotal.toLocaleString()} ₴
${sale.paymentMethod ? `Спосіб оплати: ${sale.paymentMethod}` : ""}

Дякуємо за покупку!
Гарантія на товар згідно з законодавством України
При поверненні товару чек обов'язковий
      `.trim()

      const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `receipt-${sale.receiptNumber || "unknown"}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading receipt:", error)
      alert("Помилка при завантаженні чеку")
    }
  }

  // Безопасно получаем дату (преобразуем, если нужно)
  const saleDate = sale.date ? new Date(sale.date) : null

  // Safe total calculation with fallback
  const safeTotal =
    sale.total || sale.items.reduce((sum, item) => sum + (item.cartQuantity || 0) * (item.price || 0), 0)

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4 print:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-gray-800"
          aria-label="На головну"
        >
          <Home className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Чек продажу</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={handlePrint} className="text-white hover:bg-gray-800">
            <Printer className="h-4 w-4 mr-2" />
            Друк
          </Button>
          <Button variant="ghost" onClick={handleDownload} className="text-white hover:bg-gray-800">
            <Download className="h-4 w-4 mr-2" />
            Завантажити
          </Button>
        </div>
      </header>

      {/* Receipt */}
      <div className="p-6 print:p-0">
        <Card className="max-w-md mx-auto print:shadow-none print:border-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">BadPhone</CardTitle>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Магазин мобільних аксесуарів</p>
              <p>вул. Хрещатик, 1, Київ</p>
              <p>Тел: +380 44 123 45 67</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Receipt Info */}
            <div className="border-t border-b border-dashed py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Чек №:</span>
                <span className="font-mono">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Дата:</span>
                <span>{saleDate ? saleDate.toLocaleDateString("uk-UA") : "–"}</span>
              </div>
              <div className="flex justify-between">
                <span>Час:</span>
                <span>{saleDate ? saleDate.toLocaleTimeString("uk-UA") : "–"}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h3 className="font-medium">Товари:</h3>
              {sale.items && sale.items.length > 0 ? (
                sale.items.map((item, index) => (
                  <div key={item.id || index} className="space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <p className="text-sm font-medium line-clamp-2">{item.name || "Невідомий товар"}</p>
                        <p className="text-xs text-gray-600">
                          {item.brand || ""} {item.model || ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {item.cartQuantity || 0} шт × {(item.price || 0).toLocaleString()} ₴
                      </span>
                      <span className="font-medium">
                        {((item.cartQuantity || 0) * (item.price || 0)).toLocaleString()} ₴
                      </span>
                    </div>
                    {index < sale.items.length - 1 && <hr className="border-dashed" />}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Товари відсутні</p>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-dashed pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Кількість товарів:</span>
                <span>{sale.items ? sale.items.reduce((sum, item) => sum + (item.cartQuantity || 0), 0) : 0} шт</span>
              </div>
              {sale.subtotal && (
                <div className="flex justify-between">
                  <span>Підсума:</span>
                  <span>{sale.subtotal.toLocaleString()} ₴</span>
                </div>
              )}
              {sale.discountAmount && sale.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Знижка:</span>
                  <span>-{sale.discountAmount.toLocaleString()} ₴</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>До сплати:</span>
                <span>{safeTotal.toLocaleString()} ₴</span>
              </div>
              {sale.paymentMethod && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Спосіб оплати:</span>
                  <span>{sale.paymentMethod}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 border-t border-dashed pt-4">
              <p>Дякуємо за покупку!</p>
              <p>Гарантія на товар згідно з законодавством України</p>
              <p>При поверненні товару чек обов'язковий</p>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="max-w-md mx-auto mt-6 flex gap-4 print:hidden">
          <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
            На головну
          </Button>
        </div>
      </div>
    </div>
  )
}
