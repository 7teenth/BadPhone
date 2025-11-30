"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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

export interface Product {
  id?: string;
  product_id?: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description?: string;
  brand: string;
  model: string;
  barcode?: string | null;
  store_id?: string | null;
}

interface ProductFormProps {
  product?: Partial<Product>;
  onSubmit: (productData: Product) => void;
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
    store_id: currentUser?.store_id ?? "",
  });

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      let defaults: Partial<typeof formData> = {};
      try {
        const raw = localStorage.getItem("lastProductDefaults");
        if (raw) defaults = JSON.parse(raw);
      } catch {}

      if (!product) {
        setFormData((prev) => ({ ...prev, ...defaults }));
        setLoaded(true);
        return;
      }

      const productId = product.id ?? (product as any).product_id;

      let fullProduct: Partial<Product> | undefined = products.find(
        (p) => p.id === productId
      );

      if (!fullProduct && productId) {
        try {
          const { data: dbProduct } = await supabase
            .from("products")
            .select("*")
            .eq("id", productId)
            .maybeSingle();
          fullProduct = dbProduct ?? product;
        } catch {
          fullProduct = product;
        }
      }

      if (fullProduct) {
        setFormData({
          name: fullProduct.name ?? "",
          category: fullProduct.category ?? "",
          price: fullProduct.price != null ? fullProduct.price.toString() : "",
          quantity:
            fullProduct.quantity != null ? fullProduct.quantity.toString() : "",
          description: fullProduct.description ?? "",
          brand: fullProduct.brand ?? "",
          model: fullProduct.model ?? "",
          barcode: fullProduct.barcode ?? "",
          store_id: fullProduct.store_id ?? currentUser?.store_id ?? "",
        });
      } else {
        setFormData((prev) => ({ ...prev, ...defaults }));
      }

      setLoaded(true);
    };

    loadProduct();
  }, [product, products, currentUser]);

  if (!loaded) return <p>Завантаження продукту...</p>;

  const knownCategories = Array.from(
    new Set(products.map((p) => p.category))
  ).filter(Boolean) as string[];
  const knownBrands = Array.from(new Set(products.map((p) => p.brand))).filter(
    Boolean
  ) as string[];
  const knownModels = Array.from(new Set(products.map((p) => p.model))).filter(
    Boolean
  ) as string[];

  const brandQuery = formData.brand.toLowerCase().trim();
  const modelQuery = formData.model.toLowerCase().trim();

  const brandSuggestions = knownBrands
    .filter((b) => b.toLowerCase().includes(brandQuery))
    .slice(0, 8);

  const modelsForBrand = formData.brand
    ? products
        .filter((p) => p.brand?.toLowerCase() === formData.brand.toLowerCase())
        .map((p) => p.model)
    : [];

  const modelPool = modelsForBrand.length ? modelsForBrand : knownModels;
  const modelSuggestions = Array.from(new Set(modelPool))
    .filter((m) => m?.toLowerCase().includes(modelQuery))
    .slice(0, 8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { name, category, price, quantity, brand, model } = formData;

    if (!name || !category || !brand || !model) {
      alert("Заповніть всі обов'язкові поля");
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Введіть коректну ціну");
      return;
    }
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      alert("Введіть коректну кількість");
      return;
    }

    const typedCategory = category.trim();
    if (
      !persistedCategories.some(
        (c) => c.name.toLowerCase() === typedCategory.toLowerCase()
      ) &&
      typedCategory
    ) {
      createCategory(typedCategory).catch(console.warn);
    }

    const productData: Product = {
      ...formData,
      name: name.trim(),
      category: typedCategory,
      price: parsedPrice,
      quantity: parsedQuantity,
      brand: brand.trim(),
      model: model.trim(),
      description: formData.description.trim(),
      barcode: formData.barcode.trim() || null,
      store_id: formData.store_id || null,
    };

    try {
      localStorage.setItem("lastProductDefaults", JSON.stringify(productData));
    } catch {}

    onSubmit(productData);
  };

  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
    step,
    min,
    list,
    suggestions = [],
    setValue,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    type?: string;
    step?: number;
    min?: number;
    list?: string[];
    suggestions?: string[];
    setValue?: (val: string) => void;
  }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={list && list.length > 0 ? `${label}-list` : undefined}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={label}
      />
      {list && (
        <datalist id={`${label}-list`}>
          {list.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      )}
      {suggestions.length > 0 && setValue && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue(s)}
              className="text-xs px-2 py-1 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );

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
            <InputField
              label="Назва товару *"
              value={formData.name}
              onChange={(v) => setFormData({ ...formData, name: v })}
            />
            <InputField
              label="Категорія *"
              value={formData.category}
              onChange={(v) => setFormData({ ...formData, category: v })}
              list={knownCategories}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Бренд *"
              value={formData.brand}
              onChange={(v) => setFormData({ ...formData, brand: v })}
              list={knownBrands}
              suggestions={brandSuggestions}
              setValue={(v) => setFormData({ ...formData, brand: v })}
            />
            <InputField
              label="Модель *"
              value={formData.model}
              onChange={(v) => setFormData({ ...formData, model: v })}
              list={knownModels}
              suggestions={modelSuggestions}
              setValue={(v) => setFormData({ ...formData, model: v })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Ціна (₴) *"
              type="number"
              step={0.01}
              min={0}
              value={formData.price}
              onChange={(v) => setFormData({ ...formData, price: v })}
            />
            <InputField
              label="Кількість *"
              type="number"
              step={1}
              min={0}
              value={formData.quantity}
              onChange={(v) => setFormData({ ...formData, quantity: v })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Штрих-код"
              value={formData.barcode}
              onChange={(v) => setFormData({ ...formData, barcode: v })}
            />
            {currentUser?.role === "owner" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Магазин
                </label>
                <Select
                  value={formData.store_id ?? ""}
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
