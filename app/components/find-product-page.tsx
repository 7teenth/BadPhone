"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Package, ShoppingCart, Eye } from "lucide-react"

interface Product {
  id: number
  name: string
  category: string
  price: number
  quantity: number
  description: string
  brand: string
  model: string
  createdAt: Date
}

interface FindProductPageProps {
  onBack: () => void
}

const FindProductPage = ({ onBack }: FindProductPageProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Всі")
  const [selectedBrand, setSelectedBrand] = useState("Всі")
  const [sortBy, setSortBy] = useState("name")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Sample products data
  const [products] = useState<Product[]>([
    {
      id: 1,
      name: "Чохол iPhone 15 Pro",
      category: "Чохли",
      price: 450,
      quantity: 25,
      description: "Силіконовий чохол для iPhone 15 Pro з підвищеною захистом від ударів",
      brand: "Apple",
      model: "iPhone 15 Pro",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: 2,
      name: "Зарядний кабель USB-C",
      category: "Зарядки",
      price: 280,
      quantity: 50,
      description: "Швидкий зарядний кабель USB-C довжиною 1 метр",
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
      description: "Бездротові навушники з активним шумозаглушенням",
      brand: "Apple",
      model: "AirPods Pro 2",
      createdAt: new Date("2024-01-20"),
    },
    {
      id: 4,
      name: "Захисне скло Samsung S24",
      category: "Захисні скла",
      price: 320,
      quantity: 15,
      description: "Загартоване скло для Samsung Galaxy S24 з олеофобним покриттям",
      brand: "Samsung",
      model: "Galaxy S24",
      createdAt: new Date("2024-01-12"),
    },
    {
      id: 5,
      name: "Power Bank Xiaomi 10000mAh",
      category: "Power Bank",
      price: 1200,
      quantity: 12,
      description: "Портативний зарядний пристрій з швидкою зарядкою",
      brand: "Xiaomi",
      model: "Mi Power Bank 3",
      createdAt: new Date("2024-01-18"),
    },
    {
      id: 6,
      name: "Чохол Samsung Galaxy S24",
      category: "Чохли",
      price: 380,
      quantity: 18,
      description: "Прозорий силіконовий чохол з посиленими кутами",
      brand: "Samsung",
      model: "Galaxy S24",
      createdAt: new Date("2024-01-14"),
    },
    {
      id: 7,
      name: "Бездротова зарядка iPhone",
      category: "Зарядки",
      price: 1500,
      quantity: 6,
      description: "MagSafe сумісна бездротова зарядка 15W",
      brand: "Apple",
      model: "MagSafe",
      createdAt: new Date("2024-01-16"),
    },
    {
      id: 8,
      name: "Навушники Samsung Galaxy Buds",
      category: "Навушники",
      price: 3200,
      quantity: 0,
      description: "Компактні бездротові навушники з чудовим звуком",
      brand: "Samsung",
      model: "Galaxy Buds 2",
      createdAt: new Date("2024-01-11"),
    },
  ])

  const categories = ["Всі", "Чохли", "Зарядки", "Навушники", "Захисні скла", "Power Bank"]
  const brands = ["Всі", "Apple", "Samsung", "Xiaomi", "Generic"]

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === "Всі" || product.category === selectedCategory
      const matchesBrand = selectedBrand === "Всі" || product.brand === selectedBrand

      return matchesSearch && matchesCategory && matchesBrand
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price-asc":
          return a.price - b.price
        case "price-desc":
          return b.price - a.price
        case "quantity":
          return b.quantity - a.quantity
        case "date":
          return b.createdAt.getTime() - a.createdAt.getTime()
        default:
          return 0
      }
    })

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
  }

  const closeProductDetails = () => {
    setSelectedProduct(null)
  }

  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-200">
        {/* Header */}
        <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={closeProductDetails} className="text-white hover:bg-gray-800">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Деталі товару</h1>
        </header>

        {/* Product Details */}
        <div className="p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{selectedProduct.name}</CardTitle>
                  <p className="text-gray-600">
                    {selectedProduct.brand} {selectedProduct.model}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600 mb-2">{selectedProduct.price} ₴</div>
                  <Badge
                    variant={selectedProduct.quantity > 0 ? "default" : "destructive"}
                    className={selectedProduct.quantity > 0 ? "bg-green-600" : ""}
                  >
                    {selectedProduct.quantity > 0 ? `${selectedProduct.quantity} шт` : "Немає в наявності"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Категорія</h3>
                <Badge variant="outline">{selectedProduct.category}</Badge>
              </div>

              <div>
                <h3 className="font-medium mb-2">Опис</h3>
                <p className="text-gray-700">{selectedProduct.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Бренд</h3>
                  <p className="text-gray-700">{selectedProduct.brand}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Модель</h3>
                  <p className="text-gray-700">{selectedProduct.model}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Дата додавання</h3>
                <p className="text-gray-700">{selectedProduct.createdAt.toLocaleDateString("uk-UA")}</p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={selectedProduct.quantity === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Продати товар
                </Button>
                <Button variant="outline" onClick={closeProductDetails} className="flex-1 bg-transparent">
                  Назад до пошуку
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Знайти товар</h1>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Пошук за назвою, брендом, моделлю або описом..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Категорія" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Бренд" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Сортування" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">За назвою</SelectItem>
                  <SelectItem value="price-asc">Ціна: зростання</SelectItem>
                  <SelectItem value="price-desc">Ціна: спадання</SelectItem>
                  <SelectItem value="quantity">За кількістю</SelectItem>
                  <SelectItem value="date">За датою</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("Всі")
                  setSelectedBrand("Всі")
                  setSortBy("name")
                }}
                className="bg-transparent"
              >
                Скинути фільтри
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">
            Знайдено товарів: <span className="font-bold">{filteredProducts.length}</span>
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>В наявності: {filteredProducts.filter((p) => p.quantity > 0).length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Закінчилось: {filteredProducts.filter((p) => p.quantity === 0).length}</span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">Товари не знайдено</h3>
            <p className="text-gray-500">Спробуйте змінити критерії пошуку або фільтри</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium line-clamp-2 flex-1 pr-2">{product.name}</h3>
                    <Badge
                      variant={product.quantity > 0 ? "default" : "destructive"}
                      className={`text-xs ${product.quantity > 0 ? "bg-green-600" : ""}`}
                    >
                      {product.quantity > 0 ? `${product.quantity} шт` : "Немає"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      {product.brand} {product.model}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xl font-bold text-green-600">{product.price} ₴</span>
                    <Button size="sm" onClick={() => handleProductClick(product)} variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Деталі
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FindProductPage
export { FindProductPage }
