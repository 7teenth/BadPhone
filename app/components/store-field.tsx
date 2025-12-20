// store-field.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { UseFormSetValue } from "react-hook-form";
import type { ProductFormValues } from "@/app/components/product-form";

interface StoreFieldProps {
  currentUser: any;
  stores: { id: string; name: string }[];
  getValues: () => any;
  setValue: UseFormSetValue<ProductFormValues>;
}

export const StoreField: React.FC<StoreFieldProps> = ({
  currentUser,
  stores,
  getValues,
  setValue,
}) => (
  <>
    {currentUser?.role === "owner" ? (
      <Select
        value={getValues().store_id ?? ""}
        onValueChange={(value) =>
          setValue("store_id", value || "", { shouldDirty: true })
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
    ) : (
      <Input
        readOnly
        value={
          stores.find(
            (s) => s.id === (getValues().store_id || currentUser?.store_id)
          )?.name ?? ""
        }
      />
    )}
  </>
);
