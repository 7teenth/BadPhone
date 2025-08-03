"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { BarcodeScanner } from "./barcode-scanner"
import { useApp } from "../context/app-context"
import type { SaleItem } from "@/lib/types"
import { supabase } from "@/lib/supabase" // ✅ Используем прямое обращение к Supabase
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
  AlertCircle,
  Percent,
  X,
} from "lucide-react"
import { DiscountModal } from "./discount-modal"
import { SaleReceipt } from "./sale-receipt"

// Custom components instead of shadcn/ui
const Button = ({
  children,
  onClick,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "icon"
  className?: string
  disabled?: boolean
  [key: string]: any
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded font-medium transition-colors ${
      variant === "outline"
        ? "border border-gray-300 bg-white hover:bg-gray-50"
        : variant === "ghost"
          ? "bg-transparent hover:bg-gray-100"
          : variant === "destructive"
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-green-600 text-white hover:bg-green-700"
    } ${size === "sm" ? "px-2 py-1 text-sm" : size === "icon" ? "p-2" : ""} ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    } ${className}`}
    {...props}
  >
    {children}
  </button>
)

const Badge = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode
  variant?: "default" | "secondary" | "outline" | "destructive"
  className?: string
}) => (
  <span
    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      variant === "secondary"
        ? "bg-gray-100 text-gray-800"
        : variant === "outline"
          ? "border border-gray-300 text-gray-700"
          : variant === "destructive"
            ? "bg-red-100 text-red-800"
            : "bg-blue-100 text-blue-800"
    } ${className}`}
  >
    {children}
  </span>
)

const Select = ({
  value,
  onValueChange,
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}) => (
  <select
    value={value}
    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
    {children}
  </select>
)

const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SelectValue = () => null
const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
)

const Card = ({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) => (
  <div onClick={onClick} className={`bg-white rounded-lg shadow border ${className}`}>
    {children}
  </div>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 pb-2 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)

const Input = ({
  className = "",
  onChange,
  ...props
}: {
  className?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  [key: string]: any
}) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    onChange={onChange}
    {...props}
  />
)

const Separator = ({ className = "" }: { className?: string }) => <hr className={`border-gray-200 my-4 ${className}`} />

interface SellPageProps {
  visitId: string
  onBack: () => void
  onCreateSale: (visitId: string, saleData: { items_data: SaleItem[]; total_amount: number }) => Promise<{ id: string }>
}

export default function SellPage({ visitId, onBack, onCreateSale }: SellPageProps) {
  const { products, isOnline, currentUser, currentStore } = useApp()
  const [cart, setCart] = useState<SaleItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "terminal">("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSaleData, setLastSaleData] = useState<any>(null)

  // Filter products by current store and search term
  const filteredProducts = products.filter((product) => {
    // First filter by store - only show products from current user's store
    const belongsToCurrentStore = currentStore ? product.store_id === currentStore.id : true
    
    // Then filter by search term
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
    
    return belongsToCurrentStore && matchesSearch
  })

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
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: newQuantity, total: newQuantity * item.price } : item,
        )
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

    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, quantity: newQuantity, total: newQuantity * item.price } : item,
      ),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId))
  }

  const getTotalAmount = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return subtotal - discountAmount
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const handleCompleteSale = async () => {
    console.log("🛒 handleCompleteSale вызвана!")

    if (cart.length === 0) {
      alert("Додайте товари до кошика")
      return
    }

    if (!isOnline) {
      alert("Для завершення продажу потрібен інтернет")
      return
    }

    // Предотвращаем повторные вызовы
    if (isProcessing) {
      console.log("⚠️ Sale already in progress, ignoring duplicate call")
      return
    }

    setIsProcessing(true)
    try {
      console.log("🔄 Создаем продажу с параметрами:", {
        visitId,
        saleData: {
          items_data: cart,
          total_amount: getTotalAmount(),
        },
      })

      // Вызываем функцию создания продажи
      const result = await onCreateSale(visitId, {
        items_data: cart,
        total_amount: getTotalAmount(),
      })

      console.log("✅ Продажа создана успешно:", result)

      // Подготавливаем данные для чека в правильном формате
      const receiptData = {
        id: result.id,
        receiptNumber: `RCPT-${Date.now()}`,
        date: new Date(),
        items: cart.map((item) => ({
          id: item.product_id,
          name: item.product_name,
          brand: item.brand || "",
          model: item.model || "",
          price: item.price,
          cartQuantity: item.quantity,
        })),
        total: getTotalAmount(),
        subtotal: getSubtotal(),
        discountAmount: discountAmount,
        paymentMethod: paymentMethod === "cash" ? "Готівка" : "Термінал",
      }

      setLastSaleData(receiptData)
      setShowReceipt(true)
      setCart([])
      setDiscountAmount(0)
      setDiscountPercent(0)
    } catch (error) {
      console.error("❌ Error completing sale:", error)
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

  // ✅ ИСПРАВЛЕННАЯ функция возврата с прямым обращением к Supabase
  const handleBack = async () => {
    if (isDeleting) return

    if (visitId) {
      try {
        setIsDeleting(true)
        console.log("🗑️ Deleting visit via Supabase:", visitId)

        // ✅ Используем прямое обращение к Supabase вместо API роута
        const { error } = await supabase.from("visits").delete().eq("id", visitId)

        if (error) {
          console.error("❌ Error deleting visit:", error)
          alert("Не вдалося видалити візит. Спробуйте пізніше.")
          return
        }

        console.log("✅ Visit deleted successfully")
      } catch (error) {
        console.error("❌ Error deleting visit:", error)
        alert("Не вдалося видалити візит. Спробуйте пізніше.")
        return
      } finally {
        setIsDeleting(false)
      }
    }
    onBack()
  }

  const handleNewSale = () => {
    setShowReceipt(false)
    setLastSaleData(null)
    setCart([])
    setDiscountAmount(0)
    setPaymentMethod("cash")
  }

  const handleApplyDiscount = (amount: number, percent: number) => {
    setDiscountAmount(amount)
    setDiscountPercent(percent)
    setShowDiscountModal(false)
  }

  const handleRemoveDiscount = () => {
    setDiscountAmount(0)
    setDiscountPercent(0)
  }

  const handleReceiptClose = () => {
    setShowReceipt(false)
    setLastSaleData(null)
    onBack()
  }

  // Если показываем чек, рендерим только его
  if (showReceipt && lastSaleData) {
    return <SaleReceipt sale={lastSaleData} onNewSale={handleNewSale} onBack={handleReceiptClose} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            disabled={isDeleting}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Продаж</h1>
          <Badge variant="secondary" className="bg-gray-700 text-white text-xs">
            Візит ID: {visitId}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-600 text-white border-green-600">
            <ShoppingCart className="h-3 w-3 mr-1" />
            {getTotalItems()} товарів
          </Badge>
          <div className="text-lg font-bold">{getTotalAmount().toLocaleString()} ₴</div>
        </div>
      </header>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Scanner */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Пошук товарів за назвою, брендом, моделлю або штрих-кодом..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={() => setShowScanner(true)} className="px-3">
                  <Package className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    product.quantity <= 0 ? "opacity-50" : "hover:scale-[1.02]"
                  }`}
                  onClick={() => product.quantity > 0 && addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium text-sm line-clamp-2 flex-1">{product.name}</h3>
                        <Badge
                          variant={
                            product.quantity > 10 ? "default" : product.quantity > 0 ? "secondary" : "destructive"
                          }
                          className="text-xs shrink-0"
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
                            Немає
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
        <div className="space-y-4">
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" />
                Кошик ({getTotalItems()})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-80 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Кошик порожній</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight mb-1">{item.product_name}</h4>
                        <p className="text-xs text-gray-600 mb-1">
                          {item.brand} {item.model}
                        </p>
                        <p className="text-sm font-medium text-green-600">{item.price.toLocaleString()} ₴</p>
                      </div>
                      <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                        <button
                          onClick={() => updateCartItemQuantity(item.product_id, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item.product_id, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="h-3 w-3 text-gray-600" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="h-8 w-8 flex items-center justify-center rounded-md bg-red-600 hover:bg-red-700 text-white ml-1 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
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
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4" />
                Спосіб оплати
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "cash" | "terminal")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">🏦 Готівка</SelectItem>
                    <SelectItem value="terminal">💳 Термінал</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDiscountModal(true)}
                className="w-full h-10 flex items-center justify-center gap-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                disabled={cart.length === 0}
              >
                <Percent className="h-4 w-4" />
                <span>{discountAmount > 0 ? `Знижка: ${discountPercent.toFixed(1)}%` : "Додати знижку"}</span>
              </Button>
            </CardContent>
          </Card>

          {/* Total and Checkout */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Товарів:</span>
                    <span className="font-medium">{getTotalItems()} шт</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Сума товарів:</span>
                    <span className="font-medium">{getSubtotal().toLocaleString()} ₴</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-red-600">
                      <span>Знижка ({discountPercent.toFixed(1)}%):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">-{discountAmount.toLocaleString()} ₴</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveDiscount}
                          className="h-5 w-5 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">До сплати:</span>
                    <span className="text-xl font-bold text-green-600">{getTotalAmount().toLocaleString()} ₴</span>
                  </div>
                </div>

                <Button
                  onClick={handleCompleteSale}
                  disabled={cart.length === 0 || isProcessing || !isOnline}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Обробка...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="h-5 w-5" />
                      <span>Завершити продаж</span>
                    </>
                  )}
                </Button>

                {!isOnline && (
                  <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-md">
                    Для завершення продажу потрібен інтернет
                  </p>
                )}
              </div>
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

      {/* Discount Modal */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        originalAmount={getSubtotal()}
        onApplyDiscount={handleApplyDiscount}
      />
    </div>
  )
}
