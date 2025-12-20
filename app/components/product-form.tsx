"use client";

import type { JSX } from "react";
import type React from "react";
import { FormRow } from "./form-row";
import BarcodeField from "@/app/components/barcode-field";
import { StoreField } from "@/app/components/store-field";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, UseFormSetValue } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Printer } from "lucide-react";
import BarcodeSticker from "./barcode-sticker";

// Zod schema
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
  const Tag = (as === "textarea" ? "textarea" : "input") as any; // TS теперь понимает
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
              setValue(props.name as keyof ProductFormValues, s, {
                shouldDirty: true,
              })
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

function generateBarcodeFromId(id: string): string {
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
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(numericCode[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return numericCode + checkDigit;
}

export default function ProductForm({ product, onSubmit, onCancel }: Props) {
  const {
    stores,
    currentUser,
    products,
    categories: persistedCategories,
    createCategory,
  } = useApp();

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

  const knownCategories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category).filter(Boolean))
      ) as string[],
    [products]
  );
  const knownBrands = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.brand).filter(Boolean))
      ) as string[],
    [products]
  );
  const knownModels = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.model).filter(Boolean))
      ) as string[],
    [products]
  );

  // Initialize form with product data
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

    if (product.id && product.barcode) {
      setGeneratedBarcode(product.barcode);
    } else if (product.id) {
      const barcode = generateBarcodeFromId(product.id);
      setGeneratedBarcode(barcode);
      setValue("barcode", barcode, { shouldTouch: false });
    }
  }, [product, reset, currentUser?.store_id, setValue]);

  useEffect(() => {
    if (!product) {
      setValue("store_id", currentUser?.store_id ?? "", { shouldTouch: false });
    }
  }, [currentUser?.store_id, product, setValue]);

  useEffect(() => {
    const subscription = watch((value) => {
      try {
        const toSave = {
          name: value.name ?? "",
          category: value.category ?? "",
          brand: value.brand ?? "",
          model: value.model ?? "",
          price: value.price ?? 0,
          quantity: value.quantity ?? 0,
          barcode: value.barcode ?? "",
          store_id: value.store_id ?? currentUser?.store_id ?? "",
        };
        localStorage.setItem("lastProductDefaults", JSON.stringify(toSave));
      } catch {}
    });
    return () => subscription.unsubscribe();
  }, [watch, currentUser?.store_id]);

  const createOnInputFor =
    (name: keyof ProductFormValues) =>
    (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.currentTarget.value;
      setValue(name, v as never, { shouldValidate: false, shouldDirty: true });
    };

  const onBarcodeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value;
    setValue("barcode", v, { shouldDirty: true });
    setGeneratedBarcode(v);
  };

  const onBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  const handleGenerateBarcode = () => {
    const id = product?.id || crypto.randomUUID();
    const barcode = generateBarcodeFromId(id);
    setValue("barcode", barcode, { shouldDirty: true });
    setGeneratedBarcode(barcode);
  };

  const submit = (data: ProductFormValues) => {
    const typedCategory = data.category.trim();
    if (
      typedCategory &&
      !persistedCategories.some(
        (c) => c.name.toLowerCase() === typedCategory.toLowerCase()
      )
    ) {
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

  const brandQuery = watch("brand")?.toLowerCase().trim() ?? "";
  const modelQuery = watch("model")?.toLowerCase().trim() ?? "";

  const brandSuggestions = useMemo(() => {
    if (!brandQuery) return knownBrands.slice(0, 8);
    return knownBrands
      .filter((b) => b.toLowerCase().includes(brandQuery))
      .slice(0, 8);
  }, [brandQuery, knownBrands]);

  const modelSuggestions = useMemo(() => {
    const currentBrand = watch("brand")?.toLowerCase().trim() ?? "";
    const modelsForBrand = currentBrand
      ? products
          .filter((p) => p.brand?.toLowerCase() === currentBrand)
          .map((p) => p.model)
          .filter(Boolean)
      : [];
    const modelPool = modelsForBrand.length ? modelsForBrand : knownModels;
    if (!modelQuery) return Array.from(new Set(modelPool)).slice(0, 8);
    return Array.from(new Set(modelPool))
      .filter((m) => m?.toLowerCase().includes(modelQuery))
      .slice(0, 8);
  }, [modelQuery, knownModels, products, watch]);

  const currentBarcode = watch("barcode");
  const currentName = watch("name");
  const currentPrice = watch("price");

  return (
    <>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {product ? "Редагувати товар" : "Додати новий товар"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="space-y-6">
            {/* Основна інформація */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Назва товару *"
                {...register("name")}
                placeholder="Введіть назву"
                error={errors.name}
                onInput={createOnInputFor("name")}
              />
              <FormField
                label="Категорія *"
                {...register("category")}
                placeholder="Введіть категорію"
                error={errors.category}
                onInput={createOnInputFor("category")}
              />
            </div>

            {/* Бренд та модель */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SuggestionsInput
                label="Бренд *"
                {...register("brand")}
                placeholder="Введіть бренд"
                error={errors.brand}
                suggestions={brandSuggestions}
                onInput={createOnInputFor("brand")}
                setValue={setValue}
              />
              <SuggestionsInput
                label="Модель *"
                {...register("model")}
                placeholder="Введіть модель"
                error={errors.model}
                suggestions={modelSuggestions}
                onInput={createOnInputFor("model")}
                setValue={setValue}
              />
            </div>

            {/* Ціна та кількість */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Ціна (₴) *"
                type="number"
                step={0.01}
                min={0}
                {...register("price", { valueAsNumber: true })}
                placeholder="0.00"
                error={errors.price}
                onInput={createOnInputFor("price")}
              />
              <FormField
                label="Кількість *"
                type="number"
                step={1}
                min={0}
                {...register("quantity", { valueAsNumber: true })}
                placeholder="0"
                error={errors.quantity}
                onInput={createOnInputFor("quantity")}
              />
            </div>

            {/* Штрих-код та магазин */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <BarcodeField
                ref={barcodeRef}
                value={currentBarcode ?? undefined}
                onInput={onBarcodeInput}
                onKeyDown={onBarcodeKeyDown}
                onGenerate={handleGenerateBarcode}
                onPrint={() => setShowBarcodeModal(true)}
                error={errors.barcode}
              />
              <StoreField
                currentUser={currentUser}
                stores={stores}
                getValues={getValues}
                setValue={setValue}
              />
            </div>

            {/* Опис */}
            <FormField
              label="Опис"
              as="textarea"
              {...register("description")}
              placeholder="Введіть опис товару"
              onInput={createOnInputFor("description")}
              rows={4}
            />

            {/* Дії */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmitting}
              >
                {product ? "Зберегти зміни" : "Додати товар"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showBarcodeModal && currentBarcode && (
        <BarcodeSticker
          barcode={currentBarcode}
          productName={currentName || "Товар"}
          price={currentPrice || 0}
          onClose={() => setShowBarcodeModal(false)}
        />
      )}
    </>
  );
}
