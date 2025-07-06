"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Plus, AlertCircle, CheckCircle } from "lucide-react"

interface Product {
  id: number
  name: string
  category: string
  price: number
  purchasePrice: number
  quantity: number
  description?: string
  brand: string
  model: string
  created_at: Date
  barcode?: string
  store_id?: string | null
}

interface BarcodeScannerProps {
  onClose: () => void
  onProductAdded: (product: Omit<Product, "id" | "created_at"> & { store_id?: string | null }) => void
  stores: { id: string; name: string }[]
  currentUserStoreId: string | null
}

const CATEGORY_STORAGE_KEY = "barcodeScannerLastCategory"
const STORE_STORAGE_KEY = "barcodeScannerLastStoreId"

export function BarcodeScanner({ onClose, onProductAdded, stores, currentUserStoreId }: BarcodeScannerProps) {
  const [productData, setProductData] = useState(() => {
    let savedCategory: string | null = null
    if (typeof window !== "undefined") {
      savedCategory = localStorage.getItem(CATEGORY_STORAGE_KEY)
    }
    return {
      name: "",
      category: savedCategory || "Різне",
      price: "",
      purchasePrice: "",
      quantity: "",
      description: "",
      brand: "",
      model: "",
    }
  })

  const [barcode, setBarcode] = useState("")
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORE_STORAGE_KEY) || currentUserStoreId || null
    }
    return currentUserStoreId || null
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const categories = [
    "Захисне скло",
    "Чохли",
    "Зарядні пристрої",
    "Навушники",
    "PowerBank",
    "Годинник",
    "Колонки",
    "Компʼютерна периферія",
    "Автомобільні аксесуари",
    "Освітлення",
    "Різне",
  ]

  const validateForm = () => {
    if (!productData.name.trim()) return "Назва товару обов'язкова"
    if (!productData.category) return "Оберіть категорію"
    if (!productData.price || isNaN(Number(productData.price)) || Number(productData.price) <= 0) {
      return "Введіть коректну ціну"
    }
    if (!productData.purchasePrice || isNaN(Number(productData.purchasePrice)) || Number(productData.purchasePrice) < 0) {
      return "Введіть коректну ціну закупки"
    }
    if (!productData.quantity || isNaN(Number(productData.quantity)) || Number(productData.quantity) < 0) {
      return "Введіть коректну кількість"
    }
    if (!productData.brand.trim()) return "Бренд обов'язковий"
    if (!productData.model.trim()) return "Модель обов'язкова"
    if (!selectedStoreId) return "Оберіть магазин"
    return null
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value
    setProductData({ ...productData, category: newCategory })
    if (typeof window !== "undefined") {
      localStorage.setItem(CATEGORY_STORAGE_KEY, newCategory)
    }
  }

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStoreId = e.target.value || null
    setSelectedStoreId(newStoreId)
    if (typeof window !== "undefined") {
      if (newStoreId) {
        localStorage.setItem(STORE_STORAGE_KEY, newStoreId)
      } else {
        localStorage.removeItem(STORE_STORAGE_KEY)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    const product = {
      name: productData.name.trim(),
      category: productData.category,
      price: Number(productData.price),
      purchasePrice: Number(productData.purchasePrice),
      quantity: Number(productData.quantity),
      description: productData.description.trim(),
      brand: productData.brand.trim(),
      model: productData.model.trim(),
      barcode: barcode.trim() || undefined,
      store_id: selectedStoreId,
    }

    onProductAdded(product)
    setSuccess("Товар успішно додано!")

    setTimeout(() => {
      const savedCategory = typeof window !== "undefined" ? localStorage.getItem(CATEGORY_STORAGE_KEY) : null
      const savedStoreId = typeof window !== "undefined" ? localStorage.getItem(STORE_STORAGE_KEY) : null

      setBarcode("")
      setProductData({
        name: "",
        category: savedCategory || "Різне",
        price: "",
        purchasePrice: "",
        quantity: "",
        description: "",
        brand: "",
        model: "",
      })
      setSelectedStoreId(savedStoreId || currentUserStoreId || null)
      setSuccess("")
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Додати товар
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barcode input */}
          <div className="space-y-4">
            <Label htmlFor="barcode">Штрих-код</Label>
            <Input
              id="barcode"
              ref={inputRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Введіть штрих-код"
            />
          </div>

          {/* Store selector */}
          <div className="space-y-2">
            <Label htmlFor="store">Магазин *</Label>
            <select
              id="store"
              value={selectedStoreId || ""}
              onChange={handleStoreChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Оберіть магазин</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва товару *</Label>
                <Input
                  id="name"
                  value={productData.name}
                  onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                  placeholder="Введіть назву товару"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Категорія *</Label>
                <select
                  id="category"
                  value={productData.category}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Бренд *</Label>
                <Input
                  id="brand"
                  value={productData.brand}
                  onChange={(e) => setProductData({ ...productData, brand: e.target.value })}
                  placeholder="Введіть бренд"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Модель *</Label>
                <Input
                  id="model"
                  value={productData.model}
                  onChange={(e) => setProductData({ ...productData, model: e.target.value })}
                  placeholder="Введіть модель"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Ціна (₴) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productData.price}
                  onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Ціна закупки (₴) *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productData.purchasePrice}
                  onChange={(e) => setProductData({ ...productData, purchasePrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Кількість *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={productData.quantity}
                  onChange={(e) => setProductData({ ...productData, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Опис</Label>
              <textarea
                id="description"
                value={productData.description}
                onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                placeholder="Введіть опис товару"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Додати товар
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Скасувати
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
