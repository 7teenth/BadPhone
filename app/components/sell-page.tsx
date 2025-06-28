"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, ShoppingCart, Plus, Minus, Trash2, Receipt, Banknote, CreditCard } from "lucide-react"
import { SaleReceipt } from "./sale-receipt"
import { useApp } from "../context/app-context"
import { Label } from "@/components/ui/label"

interface CartItem {
  id: string
  name: string
  category: string
  price: number
  quantity: number
  description?: string
  brand: string
  model: string
  cartQuantity: number
}

interface Sale {
  id: number
  items: CartItem[]
  total: number
  date: Date
  receiptNumber: string
  payment_method: "cash" | "terminal"
}

interface SellPageProps {
  onBack: () => void
}

const SellPage = ({ onBack }: SellPageProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [showReceipt, setShowReceipt] = useState(false)
  const [currentSale, setCurrentSale] = useState<Sale | null>(null)
  const { addSale, products } = useApp()
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "terminal">("cash")

  const filteredProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((product) => product.quantity > 0)

  const addToCart = (product: any) => {
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      if (existingItem.cartQuantity < product.quantity) {
        setCart(cart.map((item) => (item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item)))
      }
    } else {
      setCart([...cart, { ...product, cartQuantity: 1 }])
    }
  }

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter((item) => item.id !== productId))
    } else {
      const product = products.find((p) => p.id === productId)
      if (product && newQuantity <= product.quantity) {
        setCart(cart.map((item) => (item.id === productId ? { ...item, cartQuantity: newQuantity } : item)))
      }
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId))
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.cartQuantity, 0)
  }

  const completeSale = () => {
    if (cart.length === 0) return

    const receiptNumber = `RCP-${Date.now()}`
    const sale: Sale = {
      id: Date.now(),
      items: [...cart],
      total: getTotalAmount(),
      date: new Date(),
      receiptNumber,
      payment_method: paymentMethod,
    }

    // Добавляем продажу в контекст приложения
    addSale({
      receipt_number: receiptNumber,
      total_amount: getTotalAmount(),
      items_data: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        cartQuantity: item.cartQuantity,
        brand: item.brand,
        model: item.model,
      })),
      payment_method: paymentMethod,
      seller_id: undefined,
    })

    setCurrentSale(sale)
    setShowReceipt(true)
    setCart([])
  }

  const clearCart = () => {
    setCart([])
  }

  if (showReceipt && currentSale) {
    return (
      <SaleReceipt
        sale={currentSale}
        onBack={() => setShowReceipt(false)}
        onNewSale={() => {
          setShowReceipt(false)
          setCurrentSale(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Продаж товарів</h1>
        <div className="ml-auto flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <Badge variant="secondary" className="bg-white text-black">
            {cart.reduce((sum, item) => sum + item.cartQuantity, 0)}
          </Badge>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Products Section */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Пошук товарів для продажу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium line-clamp-2">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          {product.brand} {product.model}
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{product.category}</Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {product.quantity} шт
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-green-600">{product.price} ₴</span>
                        <Button
                          onClick={() => addToCart(product)}
                          size="sm"
                          className="bg-black hover:bg-gray-800"
                          disabled={cart.find((item) => item.id === product.id)?.cartQuantity === product.quantity}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Додати
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Товари не знайдено або закінчились</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Кошик</h2>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Очистити
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Кошик порожній</p>
                <p className="text-sm text-gray-400">Додайте товари для продажу</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                        <p className="text-xs text-gray-600">
                          {item.brand} {item.model}
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-bold text-green-600">{item.price} ₴</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="h-6 w-6 text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                            className="h-8 w-8"
                            disabled={item.cartQuantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.cartQuantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
                            className="h-8 w-8"
                            disabled={item.cartQuantity >= item.quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-bold">{(item.price * item.cartQuantity).toLocaleString()} ₴</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Total and Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t bg-gray-50">
              <div className="space-y-4">
                {/* Payment Method Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Спосіб оплати:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("cash")}
                      className={`text-sm ${paymentMethod === "cash" ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                    >
                      <Banknote className="h-4 w-4 mr-1" />
                      Готівка
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === "terminal" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("terminal")}
                      className={`text-sm ${paymentMethod === "terminal" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      Термінал
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Загальна сума:</span>
                  <span className="text-green-600">{getTotalAmount().toLocaleString()} ₴</span>
                </div>

                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Товарів:</span>
                    <span>{cart.reduce((sum, item) => sum + item.cartQuantity, 0)} шт</span>
                  </div>
                </div>

                <Button onClick={completeSale} className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                  <Receipt className="h-4 w-4 mr-2" />
                  Оформити продаж
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SellPage
