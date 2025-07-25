"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import type { Product } from "@/lib/types"


interface ProductFormProps {
  product?: Product | null
  onSave: (product: Omit<Product, "id" | "created_at">) => void
  onCancel: () => void
}

type FormData = {
  name: string
  category: string
  price: string
  purchasePrice: string
  quantity: string
  description: string
  brand: string
  model: string
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    category: "",
    price: "",
    purchasePrice: "",
    quantity: "",
    description: "",
    brand: "",
    model: "",
  })

  const [errors, setErrors] = useState<Record<keyof FormData, string>>({} as Record<keyof FormData, string>)

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

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        purchasePrice: product.purchasePrice?.toString() ?? "",
        quantity: product.quantity.toString(),
        description: product.description ?? "",
        brand: product.brand,
        model: product.model,
      })
      setErrors({} as Record<keyof FormData, string>)
    }
  }, [product])

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Назва товару обов'язкова"
    }

    if (!formData.category) {
      newErrors.category = "Оберіть категорію"
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Введіть коректну ціну"
    }

    if (
      formData.purchasePrice === "" ||
      isNaN(Number(formData.purchasePrice)) ||
      Number(formData.purchasePrice) < 0
    ) {
      newErrors.purchasePrice = "Введіть коректну ціну закупки"
    }

    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      newErrors.quantity = "Введіть коректну кількість"
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "Бренд обов'язковий"
    }

    if (!formData.model.trim()) {
      newErrors.model = "Модель обов'язкова"
    }

    setErrors(newErrors as Record<keyof FormData, string>)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    onSave({
      name: formData.name.trim(),
      category: formData.category,
      price: Number(formData.price),
      purchasePrice: Number(formData.purchasePrice),
      quantity: Number(formData.quantity),
      description: formData.description.trim(),
      brand: formData.brand.trim(),
      model: formData.model.trim(),
    })
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-white hover:bg-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">{product ? "Редагувати товар" : "Додати товар"}</h1>
      </header>

      {/* Form */}
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{product ? "Редагування товару" : "Новий товар"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Назва */}
              <div className="space-y-2">
                <Label htmlFor="name">Назва товару *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Введіть назву товару"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              {/* Категорія */}
              <div className="space-y-2">
                <Label htmlFor="category">Категорія *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                >
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Оберіть категорію" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
              </div>

              {/* Бренд та Модель */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Бренд *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    placeholder="Введіть бренд"
                    className={errors.brand ? "border-red-500" : ""}
                  />
                  {errors.brand && <p className="text-red-500 text-sm">{errors.brand}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Модель *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    placeholder="Введіть модель"
                    className={errors.model ? "border-red-500" : ""}
                  />
                  {errors.model && <p className="text-red-500 text-sm">{errors.model}</p>}
                </div>
              </div>

              {/* Ціна, Ціна закупки та Кількість */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Ціна (₴) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Ціна закупки (₴) *</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                    placeholder="0.00"
                    className={errors.purchasePrice ? "border-red-500" : ""}
                  />
                  {errors.purchasePrice && <p className="text-red-500 text-sm">{errors.purchasePrice}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Кількість *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    placeholder="0"
                    className={errors.quantity ? "border-red-500" : ""}
                  />
                  {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
                </div>
              </div>

              {/* Опис */}
              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Введіть опис товару"
                  rows={3}
                />
              </div>

              {/* Кнопки дії */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="bg-black hover:bg-gray-800 text-white flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {product ? "Зберегти зміни" : "Додати товар"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                  Скасувати
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
