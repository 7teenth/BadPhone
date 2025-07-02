"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Printer, Download, Plus } from "lucide-react"

interface CartItem {
  id: number
  name: string
  category: string
  price: number
  quantity: number
  description?: string
  brand: string
  model: string
  created_at: Date
  cartQuantity: number
}

interface Sale {
  id: number
  items: CartItem[]
  total: number
  date: Date
  receiptNumber: string
}

interface SaleReceiptProps {
  sale: Sale
  onBack: () => void
  onNewSale: () => void
}

export function SaleReceipt({ sale, onBack, onNewSale }: SaleReceiptProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // В реальном приложении здесь будет генерация PDF
    console.log("Downloading receipt...")
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
          <ArrowLeft className="h-6 w-6" />
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
                <span>{sale.date.toLocaleDateString("uk-UA")}</span>
              </div>
              <div className="flex justify-between">
                <span>Час:</span>
                <span>{sale.date.toLocaleTimeString("uk-UA")}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h3 className="font-medium">Товари:</h3>
              {sale.items.map((item, index) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.brand} {item.model}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      {item.cartQuantity} шт × {item.price} ₴
                    </span>
                    <span className="font-medium">{(item.cartQuantity * item.price).toLocaleString()} ₴</span>
                  </div>
                  {index < sale.items.length - 1 && <hr className="border-dashed" />}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-dashed pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Кількість товарів:</span>
                <span>{sale.items.reduce((sum, item) => sum + item.cartQuantity, 0)} шт</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>До сплати:</span>
                <span>{sale.total.toLocaleString()} ₴</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 border-t border-dashed pt-4">
              <p>Дякуємо за покупку!</p>
              <p>Гарантія на товар згідно з законодавством України</p>
              <p>При поверненні товару чек обов'язковий</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="max-w-md mx-auto mt-6 flex gap-4 print:hidden">
          <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
            Назад до продажів
          </Button>
          <Button onClick={onNewSale} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Новий продаж
          </Button>
        </div>
      </div>
    </div>
  )
}
