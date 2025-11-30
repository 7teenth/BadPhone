"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  Package,
  DollarSign,
  Hash,
  Calendar,
  Trash2,
  Shield,
  Info,
  X,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Product } from "@/lib/supabase";

interface DeleteConfirmDialogProps {
  product: Product;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  product,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [reason, setReason] = useState("");

  const expectedConfirmText = "ВИДАЛИТИ";
  const isConfirmValid = confirmText === expectedConfirmText && confirmChecked;

  const handleConfirm = () => {
    if (isConfirmValid && !isLoading) {
      onConfirm();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isConfirmValid) {
      handleConfirm();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const formatDate = (dateString: string) => formatDateTime(dateString);

  const getImpactWarnings = () => {
    const warnings = [];

    if (product.quantity > 0) {
      warnings.push({
        type: "inventory",
        message: `Буде втрачено ${product.quantity} одиниць товару на складі`,
        severity: "high",
      });
    }

    const totalValue = product.quantity * product.price;
    if (totalValue > 1000) {
      warnings.push({
        type: "financial",
        message: `Загальна вартість товару на складі: ${formatCurrency(
          totalValue
        )}`,
        severity: "high",
      });
    }

    if (product.barcode) {
      warnings.push({
        type: "barcode",
        message: "Штрих-код буде видалено з системи",
        severity: "medium",
      });
    }

    return warnings;
  };

  const impactWarnings = getImpactWarnings();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600 flex items-center justify-center gap-2">
            <Trash2 className="h-6 w-6" />
            {title}
          </CardTitle>
          <p className="text-gray-600 mt-2">{message}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Product Information */}
          <div className="bg-gray-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{product.category}</Badge>
                    <span className="text-gray-600">
                      {product.brand} {product.model}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span>Кількість: {product.quantity} шт</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span>Створено: {formatDate(product.created_at)}</span>
                  </div>
                </div>
                {product.barcode && (
                  <div className="flex items-center gap-2 mt-2">
                    <Hash className="h-4 w-4 text-gray-600" />
                    <span className="font-mono text-sm">{product.barcode}</span>
                  </div>
                )}
                {product.description && (
                  <p className="text-sm text-gray-600 mt-2 italic">
                    "{product.description}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Impact Warnings */}
          {impactWarnings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Наслідки видалення:
              </h4>
              {impactWarnings.map((warning, index) => (
                <Alert
                  key={index}
                  variant={
                    warning.severity === "high" ? "destructive" : "default"
                  }
                  className={
                    warning.severity === "high"
                      ? "border-red-200 bg-red-50"
                      : "border-yellow-200 bg-yellow-50"
                  }
                >
                  <AlertTriangle
                    className={`h-4 w-4 ${
                      warning.severity === "high"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  />
                  <AlertDescription
                    className={
                      warning.severity === "high"
                        ? "text-red-800"
                        : "text-yellow-800"
                    }
                  >
                    {warning.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Additional Details Toggle */}
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-600 hover:text-gray-800 p-0 h-auto"
            >
              <Info className="h-4 w-4 mr-1" />
              {showDetails ? "Приховати деталі" : "Показати додаткові деталі"}
            </Button>

            {showDetails && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">ID товару:</span>
                    <span className="ml-2 font-mono">{product.id}</span>
                  </div>
                  <div>
                    <span className="font-medium">Останнє оновлення:</span>
                    <span className="ml-2">
                      {formatDate(product.updated_at)}
                    </span>
                  </div>
                </div>
                {(product as any).purchasePrice && (
                  <div>
                    <span className="font-medium">Ціна закупки:</span>
                    <span className="ml-2">
                      {formatCurrency((product as any).purchasePrice)}
                    </span>
                    <span className="ml-2 text-gray-600">
                      (прибуток:{" "}
                      {formatCurrency(
                        product.price - (product as any).purchasePrice
                      )}
                      )
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reason for deletion */}
          <div className="space-y-2">
            <Label htmlFor="reason">Причина видалення (необов'язково)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Наприклад: товар знятий з виробництва, помилка при додаванні..."
              onKeyPress={handleKeyPress}
            />
          </div>

          {/* Confirmation Steps */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">
              Для підтвердження видалення:
            </h4>

            {/* Step 1: Checkbox */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="confirm-checkbox"
                checked={confirmChecked}
                onCheckedChange={(checked) =>
                  setConfirmChecked(checked === true)
                }
                className="mt-1"
              />
              <Label
                htmlFor="confirm-checkbox"
                className="text-sm leading-relaxed"
              >
                Я розумію, що це дія незворотна і товар буде повністю видалений
                з системи
              </Label>
            </div>

            {/* Step 2: Text confirmation */}
            <div className="space-y-2">
              <Label htmlFor="confirm-text">
                Введіть{" "}
                <code className="bg-gray-200 px-1 rounded font-mono">
                  {expectedConfirmText}
                </code>{" "}
                для підтвердження:
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={expectedConfirmText}
                className={
                  confirmText && confirmText !== expectedConfirmText
                    ? "border-red-500"
                    : ""
                }
                onKeyPress={handleKeyPress}
                disabled={!confirmChecked}
              />
              {confirmText && confirmText !== expectedConfirmText && (
                <p className="text-red-500 text-sm">Текст не співпадає</p>
              )}
            </div>
          </div>

          {/* Final Warning */}
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">
              ⚠️ УВАГА: Після видалення відновити товар буде неможливо!
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-transparent"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Скасувати
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              className="flex-1"
              disabled={!isConfirmValid || isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isLoading ? "Видалення..." : "Видалити товар"}
            </Button>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            <kbd className="bg-gray-100 px-1 rounded">Enter</kbd> - підтвердити
            •<kbd className="bg-gray-100 px-1 rounded ml-1">Esc</kbd> -
            скасувати
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
