import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer } from "lucide-react";

interface BarcodeFieldProps {
  value?: string;
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onGenerate?: () => void;
  onPrint?: () => void;
  error?: any;
}

const BarcodeField = React.forwardRef<HTMLInputElement, BarcodeFieldProps>(
  ({ value, onInput, onKeyDown, onGenerate, onPrint, error }, ref) => {
    return (
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Штрих-код</label>
        <div className="flex gap-2">
          <Input
            ref={ref}
            value={value ?? ""}
            onInput={onInput}
            onKeyDown={onKeyDown}
            placeholder="Штрих-код"
          />
          <Button type="button" variant="outline" onClick={onGenerate}>
            Генерувати
          </Button>
          {value && onPrint && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrint}
              title="Друкувати штрих-код"
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-red-600">{error.message}</p>}
      </div>
    );
  }
);

export default BarcodeField;
