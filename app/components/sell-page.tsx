"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { BarcodeScanner } from "./barcode-scanner"
import { useApp } from "../context/app-context"
import type { SaleItem } from "@/lib/types"
import { deleteVisit } from "@/lib/api"
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Package,
  Search,
  Calculator,
  Receipt,
  Banknote,
  CreditCard,
  AlertCircle,
} from "lucide-react"

interface SellPageProps {
  visitId: string
  onBack: () => void
  onCreateSale: (visitId: string, saleData: { items_data: SaleItem[]; total_amount: number }) => Promise<{ id: string }>
}

export default function SellPage({ visitId, onBack, onCreateSale }: SellPageProps) {
  const { products, isOnline, removeVisit } = useApp() // Добавляем removeVisit из контекста
  const [cart, setCart] = useState<SaleItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "terminal">("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm)),
  )

  const addToCart = useCallback((product: (typeof products)[0]) => {
    if (product.quantity <= 0) {
      alert("Товар закінчився на складі")
      return
    }
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product_id === product.id)
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1
        if (newQuantity > product.quantity) {
          alert(`Недостатньо товару на складі. Доступно: ${product.quantity}`)
          return prev
        }
        return prev.map((item) => (item.product_id === product.id ? { ...item, quantity: newQuantity } : item))
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            brand: product.brand,
            model: product.model,
            price: product.price,
            quantity: 1,
            total: product.price * 1,
          },
        ]
      }
    })
  }, [])

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    const product = products.find((p) => p.id === productId)
    if (product && newQuantity > product.quantity) {
      alert(`Недостатньо товару на складі. Доступно: ${product.quantity}`)
      return
    }
    setCart((prev) => prev.map((item) => (item.product_id === productId ? { ...item, quantity: newQuantity } : item)))
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId))
  }

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert("Додайте товари до кошика")
      return
    }
    if (!isOnline) {
      alert("Для завершення продажу потрібен інтернет")
      return
    }
    setIsProcessing(true)
    try {
      await onCreateSale(visitId, {
        items_data: cart,
        total_amount: getTotalAmount(),
      })
      alert("Продаж успішно завершено!")
      setCart([])
      onBack()
    } catch (error) {
      console.error("Error completing sale:", error)
      alert("Помилка при завершенні продажу: " + (error as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBarcodeDetected = (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode)
    if (product) {
      addToCart(product)
      setShowScanner(false)
    } else {
      alert("Товар з таким штрих-кодом не знайдено")
    }
  }

  // ОБНОВЛЕННАЯ функция handleBack с обновлением UI
  const handleBack = async () => {
    if (isDeleting) return

    if (visitId) {
      try {
        setIsDeleting(true)
        await deleteVisit(visitId)
        console.log("Визит успешно удален")

        // ВАЖНО: Обновляем локальное состояние после успешного удаления
        removeVisit(visitId)
      } catch (error) {
        console.error("Помилка при видаленні візиту:", error)
        alert("Не вдалося видалити візит. Спробуйте пізніше.")
        return
      } finally {
        setIsDeleting(false)
      }
    }
    onBack()
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            disabled={isDeleting}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Продаж</h1>
          <Badge variant="secondary" className="bg-gray-700 text-white">
            Візит ID: {visitId}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-600 text-white border-green-600">
            <ShoppingCart className="h-4 w-4 mr-1" />
            {getTotalItems()} товарів
          </Badge>
          <div className="text-xl font-bold">{getTotalAmount().toLocaleString()} ₴</div>
        </div>
      </header>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Scanner */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Пошук товарів за назвою, брендом, моделлю або штрих-кодом..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">Товари не знайдено</h3>
                <p className="text-gray-500">Спробуйте змінити критерії пошуку</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    product.quantity <= 0 ? "opacity-50" : "hover:scale-105"
                  }`}
                  onClick={() => product.quantity > 0 && addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                        <Badge
                          variant={
                            product.quantity > 10 ? "default" : product.quantity > 0 ? "secondary" : "destructive"
                          }
                          className="text-xs"
                        >
                          {product.quantity} шт
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        {product.brand} {product.model}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-600">{product.price.toLocaleString()} ₴</span>
                        {product.quantity <= 0 && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Немає в наявності
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-6">
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Кошик ({getTotalItems()})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Кошик порожній</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.product_name}</h4>
                        <p className="text-xs text-gray-600">
                          {item.brand} {item.model}
                        </p>
                        <p className="text-sm font-medium text-green-600">{item.price.toLocaleString()} ₴</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartItemQuantity(item.product_id, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartItemQuantity(item.product_id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.product_id)}
                          className="h-8 w-8 p-0 ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Спосіб оплати
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Select value={paymentMethod} onValueChange={(value: "cash" | "terminal") => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Готівка
                    </div>
                  </SelectItem>
                  <SelectItem value="terminal">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Термінал
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Total and Checkout */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Товарів:</span>
                  <span>{getTotalItems()} шт</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>До сплати:</span>
                  <span className="text-green-600">{getTotalAmount().toLocaleString()} ₴</span>
                </div>
              </div>
              <Button
                onClick={handleCompleteSale}
                disabled={cart.length === 0 || isProcessing || !isOnline}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-medium"
              >
                {isProcessing ? (
                  "Обробка..."
                ) : (
                  <>
                    <Receipt className="h-5 w-5 mr-2" />
                    Завершити продаж
                  </>
                )}
              </Button>
              {!isOnline && (
                <p className="text-sm text-red-600 text-center">Для завершення продажу потрібен інтернет</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Сканування штрих-коду</h3>
              <Button variant="ghost" onClick={() => setShowScanner(false)}>
                ✕
              </Button>
            </div>
            <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} />
          </div>
        </div>
      )}
    </div>
  )
}
