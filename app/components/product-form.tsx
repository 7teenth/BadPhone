"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "../context/app-context";

interface ProductFormProps {
  product?: any;
  onSubmit: (productData: any) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const {
    stores,
    currentUser,
    products,
    categories: persistedCategories,
    createCategory,
  } = useApp();

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
  });

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
      });
    } else {
      // Для нового товара устанавливаем магазин по умолчанию
      setFormData((prev) => ({
        ...prev,
        store_id: currentUser?.store_id || "",
      }));
    }
  }, [product, currentUser]);

  // Derived lists for categories, brands, models
  const knownCategories = Array.from(
    new Set((products || []).map((p: any) => p.category))
  ).filter(Boolean);

  const knownBrands = Array.from(
    new Set((products || []).map((p: any) => p.brand))
  ).filter(Boolean);

  const knownModels = Array.from(
    new Set((products || []).map((p: any) => p.model))
  ).filter(Boolean);

  // Filtered suggestions for typeahead buttons
  const brandQuery = formData.brand.trim().toLowerCase();
  const modelQuery = formData.model.trim().toLowerCase();

  const brandSuggestions = knownBrands
    .filter(Boolean)
    .filter(
      (b) =>
        b.toLowerCase().startsWith(brandQuery) ||
        b.toLowerCase().includes(brandQuery)
    )
    .slice(0, 8);

  // If a brand is chosen, prioritize models for that brand
  const modelsForBrand = formData.brand
    ? products
        .filter(
          (p: any) =>
            p.brand && p.brand.toLowerCase() === formData.brand.toLowerCase()
        )
        .map((p: any) => p.model)
    : [];

  const modelPool = modelsForBrand.length > 0 ? modelsForBrand : knownModels;

  const modelSuggestions = Array.from(new Set(modelPool))
    .filter(Boolean)
    .filter(
      (m) =>
        m.toLowerCase().startsWith(modelQuery) ||
        m.toLowerCase().includes(modelQuery)
    )
    .slice(0, 8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.category ||
      !formData.price ||
      !formData.quantity ||
      !formData.brand ||
      !formData.model
    ) {
      alert("Заповніть всі обов'язкові поля");
      return;
    }

    const price = Number.parseFloat(formData.price);
    const quantity = Number.parseInt(formData.quantity);

    if (isNaN(price) || price <= 0) {
      alert("Введіть коректну ціну");
      return;
    }

    if (isNaN(quantity) || quantity < 0) {
      alert("Введіть коректну кількість");
      return;
    }

    // Если категория новая — сохраняем
    const typedCategory = formData.category.trim();
    const exists = (persistedCategories || []).some(
      (c: any) => c.name.toLowerCase() === typedCategory.toLowerCase()
    );
    if (!exists && typedCategory) {
      createCategory(typedCategory).catch((err) => {
        console.warn("Could not persist category:", err);
      });
    }

    const productData = {
      name: formData.name.trim(),
      category: typedCategory,
      price,
      quantity,
      description: formData.description.trim(),
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      barcode: formData.barcode.trim() || null,
      store_id: formData.store_id || null,
    };

    onSubmit(productData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {product ? "Редагувати товар" : "Додати новий товар"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Назва товару *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Введіть назву товару"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Категорія *
              </label>
              <input
                list="categories-list"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="Виберіть або введіть нову категорію"
                required
              />
              <datalist id="categories-list">
                {knownCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Бренд *</label>
              <input
                list="brands-list"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                placeholder="Введіть бренд"
                required
              />
              <datalist id="brands-list">
                {knownBrands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {brandSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {brandSuggestions.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, brand: b }))
                      }
                      className="text-xs px-2 py-1 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Модель *</label>
              <input
                list="models-list"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="Введіть модель"
                required
              />
              <datalist id="models-list">
                {knownModels.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {modelSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {modelSuggestions.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, model: m }))
                      }
                      className="text-xs px-2 py-1 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ціна (₴) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Кількість *
              </label>
              <Input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Штрих-код
              </label>
              <Input
                type="text"
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
                placeholder="Введіть штрих-код"
              />
            </div>
            {currentUser?.role === "owner" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Магазин
                </label>
                <Select
                  value={formData.store_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, store_id: value })
                  }
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
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
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
  );
}
