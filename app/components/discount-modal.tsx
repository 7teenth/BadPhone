"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Percent, Minus, X, Calculator } from "lucide-react"

interface DiscountModalProps {
  isOpen: boolean
  onClose: () => void
  originalAmount: number
  onApplyDiscount: (discountAmount: number, discountPercent: number) => void
}

export function DiscountModal({ isOpen, onClose, originalAmount, onApplyDiscount }: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent")
  const [discountValue, setDiscountValue] = useState("")
  const [calculatedDiscount, setCalculatedDiscount] = useState(0)
  const [finalAmount, setFinalAmount] = useState(originalAmount)

  if (!isOpen) return null

  const calculateDiscount = (value: string, type: "percent" | "amount") => {
    const numValue = Number.parseFloat(value) || 0
    let discountAmount = 0
    let discountPercent = 0

    if (type === "percent") {
      if (numValue > 100) return // Не больше 100%
      discountPercent = numValue
      discountAmount = (originalAmount * numValue) / 100
    } else {
      if (numValue > originalAmount) return // Не больше суммы товаров
      discountAmount = numValue
      discountPercent = (numValue / originalAmount) * 100
    }

    setCalculatedDiscount(discountAmount)
    setFinalAmount(originalAmount - discountAmount)
  }

  const handleValueChange = (value: string) => {
    setDiscountValue(value)
    calculateDiscount(value, discountType)
  }

  const handleTypeChange = (type: "percent" | "amount") => {
    setDiscountType(type)
    setDiscountValue("")
    setCalculatedDiscount(0)
    setFinalAmount(originalAmount)
  }

  const handleApply = () => {
    const discountPercent = (calculatedDiscount / originalAmount) * 100
    onApplyDiscount(calculatedDiscount, discountPercent)
    onClose()
  }

  const handleReset = () => {
    setDiscountValue("")
    setCalculatedDiscount(0)
    setFinalAmount(originalAmount)
  }

  const quickDiscounts = [5, 10, 15, 20, 25, 30]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-blue-600" />
              <CardTitle>Знижка</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Original Amount */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Сума товарів:</div>
            <div className="text-xl font-bold">{originalAmount.toLocaleString()} ₴</div>
          </div>

          {/* Discount Type Toggle */}
          <div className="flex gap-2">
            <Button
              variant={discountType === "percent" ? "default" : "outline"}
              onClick={() => handleTypeChange("percent")}
              className="flex-1"
            >
              <Percent className="h-4 w-4 mr-2" />
              Відсотки
            </Button>
            <Button
              variant={discountType === "amount" ? "default" : "outline"}
              onClick={() => handleTypeChange("amount")}
              className="flex-1"
            >
              <Minus className="h-4 w-4 mr-2" />
              Сума
            </Button>
          </div>

          {/* Quick Discount Buttons (only for percent) */}
          {discountType === "percent" && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Швидкі знижки:</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickDiscounts.map((percent) => (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => handleValueChange(percent.toString())}
                    className="text-xs"
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Discount Input */}
          <div className="space-y-2">
            <Label htmlFor="discount">{discountType === "percent" ? "Відсоток знижки:" : "Сума знижки:"}</Label>
            <div className="relative">
              <Input
                id="discount"
                type="number"
                value={discountValue}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder={discountType === "percent" ? "0" : "0"}
                min="0"
                max={discountType === "percent" ? "100" : originalAmount.toString()}
                className="pr-8"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                {discountType === "percent" ? "%" : "₴"}
              </div>
            </div>
          </div>

          {/* Calculation Preview */}
          {calculatedDiscount > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Сума товарів:</span>
                <span>{originalAmount.toLocaleString()} ₴</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Знижка ({((calculatedDiscount / originalAmount) * 100).toFixed(1)}%):</span>
                <span>-{calculatedDiscount.toLocaleString()} ₴</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-green-600">
                <span>До сплати:</span>
                <span>{finalAmount.toLocaleString()} ₴</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1 bg-transparent">
              Скинути
            </Button>
            <Button
              onClick={handleApply}
              disabled={calculatedDiscount === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Застосувати
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
