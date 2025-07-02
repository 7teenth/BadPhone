"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Edit, Trash2, Scan } from "lucide-react"
import { ProductForm } from "./product-form"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { BarcodeScanner } from "./barcode-scanner"
import { useApp } from "../context/app-context"

export interface Product {
  id: string
  name: string
  category: string
  price: number
  quantity: number
  description?: string
  brand: string
  model: string
  created_at: string // ISO string
  barcode?: string
}

interface ProductCatalogProps {
  onBack: () => void
}

export function ProductCatalog({ onBack }: ProductCatalogProps) {
  const { products, addProduct, updateProduct, deleteProduct, currentUser, stores } = useApp()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Всі")
  const [showProductForm, setShowProductForm] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteProductState, setDeleteProductState] = useState<Product | null>(null)

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

  const handleAddProduct = async (productData: Omit<Product, "id" | "created_at">) => {
    await addProduct(productData)
    setShowProductForm(false)
  }

  const handleEditProduct = async (productData: Omit<Product, "id" | "created_at">) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData)
      setEditingProduct(null)
      setShowProductForm(false)
    }
  }

  const handleDeleteProduct = (product: Product) => {
    setDeleteProductState(product)
  }

  const confirmDelete = async () => {
    if (deleteProductState) {
      await deleteProduct(deleteProductState.id)
      setDeleteProductState(null)
    }
  }

  const handleEditClick = (product: Product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleBarcodeProductAdded = (productData: Omit<Product, "id" | "created_at"> & { store_id: string | null }) => {
  handleAddProduct(productData)
  setShowBarcodeScanner(false)
}


  console.log("products from context:", products)

  // Проверяем права доступа (например, только "owner" может управлять)
  const canManageProducts = currentUser?.role === "owner"
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
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 col-span-full">
              <p className="text-gray-500 text-lg">Товари не знайдено</p>
              <p className="text-gray-400">Спробуйте змінити критерії пошуку</p>
            </div>
          )}

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
                  <span className="text-xs text-gray-500">{product.created_at ? new Date(product.created_at).toLocaleDateString("uk-UA") : "Дата відсутня"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
  <BarcodeScanner
    onClose={() => setShowBarcodeScanner(false)}
    onProductAdded={handleBarcodeProductAdded}
    stores={stores || []}
    currentUserStoreId={currentUser?.store_id || null}
  />
)}


      {/* Delete Confirmation Dialog */}
      {deleteProductState && (
        <DeleteConfirmDialog
          product={deleteProductState}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteProductState(null)}
        />
      )}
    </div>
  )
}
