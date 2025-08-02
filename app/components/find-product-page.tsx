"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Package, MapPin, Barcode, Filter, AlertCircle } from "lucide-react"
import { useApp } from "../context/app-context"
import { BarcodeScanner } from "./barcode-scanner"

interface FindProductPageProps {
  onBack: () => void
}

export function FindProductPage({ onBack }: FindProductPageProps) {
  const { products, stores, currentUser } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [storeFilter, setStoreFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [showScanner, setShowScanner] = useState(false)

  // Фильтрация продуктов
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm))

      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      const matchesStore = storeFilter === "all" || product.store_id === storeFilter
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && product.quantity > 0) ||
        (stockFilter === "out-of-stock" && product.quantity === 0)

      // Для продавца показываем только товары его магазина
      if (currentUser?.role === "seller" && currentUser.store_id) {
        return matchesSearch && matchesCategory && matchesStock && product.store_id === currentUser.store_id
      }

      return matchesSearch && matchesCategory && matchesStore && matchesStock
    })
  }, [products, searchTerm, categoryFilter, storeFilter, stockFilter, currentUser])

  // Получение уникальных категорий
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean)

  const handleBarcodeDetected = (barcode: string) => {
    setSearchTerm(barcode)
    setShowScanner(false)
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: "out", label: "Немає в наявності", color: "bg-red-500" }
    if (quantity <= 10) return { status: "low", label: "Мало на складі", color: "bg-yellow-500" }
    return { status: "good", label: "В наявності", color: "bg-green-500" }
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Пошук товарів</h1>
        <Badge variant="secondary" className="bg-gray-700 text-white">
          {filteredProducts.length} знайдено
        </Badge>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Пошук за назвою, брендом, моделлю або штрих-кодом..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowScanner(true)} className="bg-blue-600 hover:bg-blue-700">
                <Barcode className="h-4 w-4 mr-2" />
                Сканер
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Категорія" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі категорії</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentUser?.role === "owner" && (
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
              )}

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Наявність" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі товари</SelectItem>
                  <SelectItem value="in-stock">В наявності</SelectItem>
                  <SelectItem value="out-of-stock">Немає в наявності</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                  setStoreFilter("all")
                  setStockFilter("all")
                }}
                className="bg-transparent"
              >
                <Filter className="h-4 w-4 mr-2" />
                Скинути
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">Товари не знайдено</h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Спробуйте змінити критерії пошуку"
                : "Введіть назву товару, бренд, модель або відскануйте штрих-код"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.quantity)
              const store = stores.find((s) => s.id === product.store_id)

              return (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <div className={`w-3 h-3 rounded-full ${stockStatus.color}`} title={stockStatus.label} />
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{product.brand}</span> {product.model}
                        </p>
                        {product.description && <p className="text-sm text-gray-600 mb-2">{product.description}</p>}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-green-600">{product.price.toLocaleString()} ₴</span>
                          <span className={`text-sm font-medium ${stockStatus.status === "out" ? "text-red-600" : ""}`}>
                            {product.quantity} шт
                          </span>
                        </div>

                        {product.barcode && (
                          <div className="text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded">
                            Штрих-код: {product.barcode}
                          </div>
                        )}

                        {store && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{store.name}</span>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Додано: {new Date(product.created_at).toLocaleDateString("uk-UA")}
                        </div>
                      </div>

                      {product.quantity === 0 && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                          <AlertCircle className="h-4 w-4" />
                          <span>Товар закінчився</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
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
