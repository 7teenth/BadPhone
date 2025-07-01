"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Search, Edit, Trash2, Scan } from "lucide-react"
import { ProductForm } from "./product-form"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { BarcodeScanner } from "./barcode-scanner"
import { useApp } from "../context/app-context"

export interface Product {
  id: number
  name: string
  category: string
  price: number
  quantity: number
  description: string
  brand: string
  model: string
  createdAt: Date
  barcode?: string
}

interface ProductCatalogProps {
  onBack: () => void
}

export function ProductCatalog({ onBack }: ProductCatalogProps) {
  const { currentUser } = useApp()
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Чохол iPhone 15 Pro",
      category: "Чохли",
      price: 450,
      quantity: 25,
      description: "Силіконовий чохол для iPhone 15 Pro",
      brand: "Apple",
      model: "iPhone 15 Pro",
      createdAt: new Date("2024-01-15"),
      barcode: "12345678901",
    },
    {
      id: 2,
      name: "Зарядний кабель USB-C",
      category: "Зарядки",
      price: 280,
      quantity: 50,
      description: "Швидкий зарядний кабель USB-C 1м",
      brand: "Generic",
      model: "USB-C",
      createdAt: new Date("2024-01-10"),
    },
    {
      id: 3,
      name: "Навушники AirPods Pro",
      category: "Навушники",
      price: 8500,
      quantity: 8,
      description: "Бездротові навушники з шумозаглушенням",
      brand: "Apple",
      model: "AirPods Pro 2",
      createdAt: new Date("2024-01-20"),
    },
    {
      id: 4,
      name: "Захисне скло Samsung S24",
      category: "Захисні скла",
      price: 320,
      quantity: 0,
      description: "Загартоване скло для Samsung Galaxy S24",
      brand: "Samsung",
      model: "Galaxy S24",
      createdAt: new Date("2024-01-12"),
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Всі")
  const [showProductForm, setShowProductForm] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)

  const categories = ["Всі", "Чохли", "Зарядки", "Навушники", "Захисні скла", "Power Bank", "Тримачі"]

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
    const matchesCategory = selectedCategory === "Всі" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddProduct = (productData: Omit<Product, "id" | "createdAt">) => {
    const newProduct: Product = {
      ...productData,
      id: Math.max(...products.map((p) => p.id), 0) + 1,
      createdAt: new Date(),
    }
    setProducts([...products, newProduct])
    setShowProductForm(false)
  }

  const handleEditProduct = (productData: Omit<Product, "id" | "createdAt">) => {
    if (editingProduct) {
      const updatedProducts = products.map((p) =>
        p.id === editingProduct.id ? { ...productData, id: editingProduct.id, createdAt: editingProduct.createdAt } : p,
      )
      setProducts(updatedProducts)
      setEditingProduct(null)
      setShowProductForm(false)
    }
  }

  const handleDeleteProduct = (product: Product) => {
    setDeleteProduct(product)
  }

  const confirmDelete = () => {
    if (deleteProduct) {
      setProducts(products.filter((p) => p.id !== deleteProduct.id))
      setDeleteProduct(null)
    }
  }

  const handleEditClick = (product: Product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleBarcodeProductAdded = (productData: Omit<Product, "id" | "createdAt">) => {
    handleAddProduct(productData)
    setShowBarcodeScanner(false)
  }

  // Проверяем права доступа
  const canManageProducts = currentUser?.role
  if (!canManageProducts) {
    return (
      <div className="min-h-screen bg-gray-200">
        <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Каталог товарів</h1>
        </header>
        <div className="p-6">
          <Card className="p-12 text-center">
            <h3 className="text-xl font-medium text-gray-600 mb-2">Доступ заборонено</h3>
            <p className="text-gray-500">Тільки власник може управляти каталогом товарів</p>
          </Card>
        </div>
      </div>
    )
  }

  if (showProductForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSave={editingProduct ? handleEditProduct : handleAddProduct}
        onCancel={() => {
          setShowProductForm(false)
          setEditingProduct(null)
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
        <h1 className="text-2xl font-bold">Каталог товарів</h1>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Search and Add Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Пошук товарів або штрих-коду..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowBarcodeScanner(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Scan className="h-4 w-4 mr-2" />
              Штрих-код
            </Button>
            <Button onClick={() => setShowProductForm(true)} className="bg-black hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Додати товар
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-black hover:bg-gray-800" : ""}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)} className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProduct(product)}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">{product.category}</Badge>
                  <Badge
                    variant={product.quantity > 0 ? "default" : "destructive"}
                    className={product.quantity > 0 ? "bg-green-600" : ""}
                  >
                    {product.quantity > 0 ? `${product.quantity} шт` : "Немає в наявності"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {product.brand} {product.model}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  {product.barcode && <p className="text-xs text-gray-500 font-mono">Штрих-код: {product.barcode}</p>}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-2xl font-bold text-green-600">{product.price} ₴</span>
                  <span className="text-xs text-gray-500">{product.createdAt.toLocaleDateString("uk-UA")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Товари не знайдено</p>
            <p className="text-gray-400">Спробуйте змінити критерії пошуку</p>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-white rounded-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{products.length}</div>
            <div className="text-gray-600">Всього товарів</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{products.reduce((sum, p) => sum + p.quantity, 0)}</div>
            <div className="text-gray-600">Одиниць в наявності</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{products.filter((p) => p.quantity === 0).length}</div>
            <div className="text-gray-600">Товарів закінчилось</div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner onClose={() => setShowBarcodeScanner(false)} onProductAdded={handleBarcodeProductAdded} />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteProduct && (
        <DeleteConfirmDialog
          product={deleteProduct}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteProduct(null)}
        />
      )}
    </div>
  )
}
