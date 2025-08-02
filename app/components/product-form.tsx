"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApp } from "../context/app-context"

interface ProductFormProps {
  product?: any
  onSubmit: (productData: any) => void
  onCancel: () => void
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const { stores, currentUser } = useApp()
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    description: "",
    brand: "",
    model: "",
    barcode: "",
    store_id: "",
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "",
        price: product.price?.toString() || "",
        quantity: product.quantity?.toString() || "",
        description: product.description || "",
        brand: product.brand || "",
        model: product.model || "",
        barcode: product.barcode || "",
        store_id: product.store_id || "",
      })
    } else {
      // Для нового товара устанавливаем магазин по умолчанию
      setFormData((prev) => ({
        ...prev,
        store_id: currentUser?.store_id || "",
      }))
    }
  }, [product, currentUser])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.name ||
      !formData.category ||
      !formData.price ||
      !formData.quantity ||
      !formData.brand ||
      !formData.model
    ) {
      alert("Заповніть всі обов'язкові поля")
      return
    }

    const price = Number.parseFloat(formData.price)
    const quantity = Number.parseInt(formData.quantity)

    if (isNaN(price) || price <= 0) {
      alert("Введіть коректну ціну")
      return
    }

    if (isNaN(quantity) || quantity < 0) {
      alert("Введіть коректну кількість")
      return
    }

    const productData = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      price,
      quantity,
      description: formData.description.trim(),
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      barcode: formData.barcode.trim() || null,
      store_id: formData.store_id || null,
    }

    onSubmit(productData)
  }

  const categories = [
    "Смартфони",
    "Планшети",
    "Ноутбуки",
    "Аксесуари",
    "Навушники",
    "Зарядні пристрої",
    "Чохли",
    "Захисні скла",
    "Інше",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? "Редагувати товар" : "Додати новий товар"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Назва товару *</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Введіть назву товару"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Категорія *</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Виберіть категорію" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Бренд *</label>
              <Input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Введіть бренд"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Модель *</label>
              <Input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Введіть модель"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ціна (₴) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Кількість *</label>
              <Input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Штрих-код</label>
              <Input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Введіть штрих-код"
              />
            </div>
            {currentUser?.role === "owner" && (
              <div>
                <label className="block text-sm font-medium mb-1">Магазин</label>
                <Select
                  value={formData.store_id}
                  onValueChange={(value) => setFormData({ ...formData, store_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Виберіть магазин" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Опис</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Введіть опис товару"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Скасувати
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {product ? "Зберегти зміни" : "Додати товар"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
