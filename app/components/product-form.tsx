"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, UseFormSetValue } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormRow } from "./form-row";
import BarcodeField from "@/app/components/barcode-field";
import { StoreField } from "@/app/components/store-field";
import { useApp } from "../context/app-context";
import BarcodeSticker from "./barcode-sticker";

// === SCHEMA ===
const productSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().optional(),
  name: z.string().min(1, "Потрібна назва товару"),
  category: z.string().min(1, "Потрібна категорія"),
  price: z.coerce.number().min(0.01, "Ціна має бути більше 0"),
  quantity: z.coerce.number().min(0, "Кількість не може бути від'ємною"),
  description: z.string().optional().nullable(),
  brand: z.string().min(1, "Потрібен бренд"),
  model: z.string().min(1, "Потрібна модель"),
  barcode: z.string().optional().nullable(),
  store_id: z.string().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// === UTILS ===
function generateBarcodeFromId(id: string) {
  const cleanId = id.replace(/-/g, "").toUpperCase();
  let numericCode = "";

  for (let i = 0; i < Math.min(cleanId.length, 12); i++) {
    const char = cleanId[i];
    numericCode += /\d/.test(char)
      ? char
      : ((char.charCodeAt(0) - 55) % 10).toString();
  }

  numericCode = numericCode.padEnd(12, "0").slice(0, 12);

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(numericCode[i]) * (i % 2 === 0 ? 1 : 3);
  const checkDigit = (10 - (sum % 10)) % 10;

  return numericCode + checkDigit;
}

// === FORM FIELD COMPONENT ===
type FormFieldProps<T extends "input" | "textarea" = "input"> = {
  label: string;
  error?: any;
  as?: T;
} & (T extends "textarea"
  ? React.TextareaHTMLAttributes<HTMLTextAreaElement>
  : React.InputHTMLAttributes<HTMLInputElement>);

const FormField = <T extends "input" | "textarea" = "input">({
  label,
  error,
  as,
  ...props
}: FormFieldProps<T>) => {
  const Tag = as === "textarea" ? "textarea" : "input";
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Tag
        {...props}
        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {error && <p className="text-xs text-red-600">{error.message}</p>}
    </div>
  );
};

// === SUGGESTIONS INPUT ===
type SuggestionsInputProps = {
  label: string;
  suggestions: string[];
  setValue: UseFormSetValue<ProductFormValues>;
  error?: any;
  onInput?: React.FormEventHandler<HTMLInputElement>;
} & React.ComponentPropsWithoutRef<"input">;

const SuggestionsInput = ({
  label,
  suggestions,
  setValue,
  error,
  onInput,
  ...props
}: SuggestionsInputProps) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <div>
      <input
        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        onInput={onInput}
        {...props}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() =>
              setValue(props.name as keyof ProductFormValues, s, { shouldDirty: true })
            }
            className="text-xs px-2 py-1 bg-muted border border-border rounded-md hover:bg-muted/80"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
    {error && <p className="text-xs text-red-600">{error.message}</p>}
  </div>
);

// === MAIN FORM ===
interface Product {
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

interface Props {
  product?: Partial<Product>;
  onSubmit: (productData: Product) => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSubmit, onCancel }: Props) {
  const { stores, currentUser, products, categories: persistedCategories, createCategory } = useApp();

  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [generatedBarcode, setGeneratedBarcode] = useState<string | null>(null);
  const barcodeRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      price: 0,
      quantity: 0,
      description: "",
      brand: "",
      model: "",
      barcode: "",
      store_id: currentUser?.store_id ?? "",
    },
    mode: "onSubmit",
  });

  const knownCategories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[], [products]);
  const knownBrands = useMemo(() => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[], [products]);
  const knownModels = useMemo(() => Array.from(new Set(products.map((p) => p.model).filter(Boolean))) as string[], [products]);

  // === INIT FORM ===
  useEffect(() => {
    if (!product) return;

    reset({
      name: product.name ?? "",
      category: product.category ?? "",
      price: product.price ?? 0,
      quantity: product.quantity ?? 0,
      description: product.description ?? "",
      brand: product.brand ?? "",
      model: product.model ?? "",
      barcode: product.barcode ?? "",
      store_id: product.store_id ?? currentUser?.store_id ?? "",
    });

    const barcode = product.barcode || (product.id ? generateBarcodeFromId(product.id) : null);
    if (barcode) {
      setGeneratedBarcode(barcode);
      setValue("barcode", barcode, { shouldTouch: false });
    }
  }, [product, reset, currentUser?.store_id, setValue]);

  // === WATCH & SAVE TO LOCAL STORAGE ===
  useEffect(() => {
    const subscription = watch((value) => {
      try {
        localStorage.setItem("lastProductDefaults", JSON.stringify(value));
      } catch {}
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const createOnInputFor = (name: keyof ProductFormValues) => (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(name, e.currentTarget.value as never, { shouldValidate: false, shouldDirty: true });
  };

  const handleGenerateBarcode = () => {
    const id = product?.id || crypto.randomUUID();
    const barcode = generateBarcodeFromId(id);
    setGeneratedBarcode(barcode);
    setValue("barcode", barcode, { shouldDirty: true });
    barcodeRef.current?.focus();
    barcodeRef.current?.select();
  };

  const submit = (data: ProductFormValues) => {
    const typedCategory = data.category.trim();
    if (typedCategory && !persistedCategories.some((c) => c.name.toLowerCase() === typedCategory.toLowerCase())) {
      createCategory(typedCategory).catch(console.warn);
    }

    onSubmit({
      ...data,
      name: data.name.trim(),
      category: typedCategory,
      brand: data.brand.trim(),
      model: data.model.trim(),
      description: data.description?.trim() || "",
      barcode: data.barcode?.trim() || null,
      store_id: data.store_id || null,
    });
  };

  const brandQuery = watch("brand")?.toLowerCase().trim() || "";
  const modelQuery = watch("model")?.toLowerCase().trim() || "";

  const brandSuggestions = useMemo(
    () => knownBrands.filter((b) => b.toLowerCase().includes(brandQuery)).slice(0, 8),
    [brandQuery, knownBrands]
  );

  const modelSuggestions = useMemo(() => {
    const currentBrand = watch("brand")?.toLowerCase().trim() || "";
    const modelsForBrand = currentBrand
      ? products.filter((p) => p.brand?.toLowerCase() === currentBrand).map((p) => p.model).filter(Boolean)
      : [];
    const modelPool = modelsForBrand.length ? modelsForBrand : knownModels;
    return Array.from(new Set(modelPool)).filter((m) => m?.toLowerCase().includes(modelQuery)).slice(0, 8);
  }, [modelQuery, knownModels, products, watch]);

  const currentBarcode = watch("barcode");
  const currentName = watch("name");
  const currentPrice = watch("price");

  return (
    <>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{product ? "Редагувати товар" : "Додати новий товар"}</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Назва товару *" {...register("name")} placeholder="Введіть назву" error={errors.name} onInput={createOnInputFor("name")} />
              <FormField label="Категорія *" {...register("category")} placeholder="Введіть категорію" error={errors.category} onInput={createOnInputFor("category")} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SuggestionsInput label="Бренд *" {...register("brand")} placeholder="Введіть бренд" error={errors.brand} suggestions={brandSuggestions} onInput={createOnInputFor("brand")} setValue={setValue} />
              <SuggestionsInput label="Модель *" {...register("model")} placeholder="Введіть модель" error={errors.model} suggestions={modelSuggestions} onInput={createOnInputFor("model")} setValue={setValue} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Ціна (₴) *" type="number" step={0.01} min={0} {...register("price", { valueAsNumber: true })} placeholder="0.00" error={errors.price} onInput={createOnInputFor("price")} />
              <FormField label="Кількість *" type="number" step={1} min={0} {...register("quantity", { valueAsNumber: true })} placeholder="0" error={errors.quantity} onInput={createOnInputFor("quantity")} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <BarcodeField ref={barcodeRef} value={currentBarcode ?? undefined} onInput={(e) => { setValue("barcode", e.currentTarget.value, { shouldDirty: true }); setGeneratedBarcode(e.currentTarget.value); }} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} onGenerate={handleGenerateBarcode} onPrint={() => setShowBarcodeModal(true)} error={errors.barcode} />
              <StoreField currentUser={currentUser} stores={stores} getValues={getValues} setValue={setValue} />
            </div>

            <FormField label="Опис" as="textarea" {...register("description")} placeholder="Введіть опис товару" onInput={createOnInputFor("description")} rows={4} />

            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Скасувати</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting}>{product ? "Зберегти зміни" : "Додати товар"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showBarcodeModal && currentBarcode && (
        <BarcodeSticker barcode={currentBarcode} productName={currentName || "Товар"} price={currentPrice || 0} onClose={() => setShowBarcodeModal(false)} />
      )}
    </>
  );
}
