"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import type { Product } from "./product-catalog"

interface DeleteConfirmDialogProps {
  product: Product
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ product, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Підтвердження видалення</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">Ви впевнені, що хочете видалити товар?</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-600">
              {product.brand} {product.model}
            </p>
            <p className="text-sm text-gray-600">Ціна: {product.price} ₴</p>
            <p className="text-sm text-gray-600">Кількість: {product.quantity} шт</p>
          </div>
          <p className="text-sm text-red-600 text-center">Цю дію неможливо скасувати!</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
              Скасувати
            </Button>
            <Button variant="destructive" onClick={onConfirm} className="flex-1">
              Видалити
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
