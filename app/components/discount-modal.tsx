"use client"

import type React from "react"

import { useState } from "react"
import { X, Percent, Calculator } from "lucide-react"

interface DiscountModalProps {
  isOpen: boolean
  onClose: () => void
  originalAmount: number
  onApplyDiscount: (amount: number, percent: number) => void
}

const Button = ({
  children,
  onClick,
  variant = "default",
  className = "",
  disabled = false,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "outline" | "ghost"
  className?: string
  disabled?: boolean
  [key: string]: any
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      variant === "outline"
        ? "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
        : variant === "ghost"
          ? "bg-transparent hover:bg-gray-100 text-gray-700"
          : "bg-blue-600 text-white hover:bg-blue-700"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    {...props}
  >
    {children}
  </button>
)

const Input = ({ className = "", ...props }: { className?: string; [key: string]: any }) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    {...props}
  />
)

export function DiscountModal({ isOpen, onClose, originalAmount, onApplyDiscount }: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent")
  const [discountValue, setDiscountValue] = useState("")

  if (!isOpen) return null

  const handleApply = () => {
    const value = Number.parseFloat(discountValue)
    if (isNaN(value) || value <= 0) {
      alert("Введіть коректне значення знижки")
      return
    }

    let discountAmount = 0
    let discountPercent = 0

    if (discountType === "percent") {
      if (value > 100) {
        alert("Знижка не може бути більше 100%")
        return
      }
      discountPercent = value
      discountAmount = (originalAmount * value) / 100
    } else {
      if (value >= originalAmount) {
        alert("Знижка не може бути більше або дорівнювати сумі товарів")
        return
      }
      discountAmount = value
      discountPercent = (value / originalAmount) * 100
    }

    onApplyDiscount(discountAmount, discountPercent)
    setDiscountValue("")
  }

  const quickDiscounts = [5, 10, 15, 20, 25]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Додати знижку</h3>
          <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Original Amount */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Сума товарів:</p>
            <p className="text-2xl font-bold text-gray-900">{originalAmount.toLocaleString()} ₴</p>
          </div>

          {/* Discount Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDiscountType("percent")}
              className={`h-12 flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${
                discountType === "percent"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Percent className="h-4 w-4" />
              <span>Відсотки</span>
            </button>
            <button
              onClick={() => setDiscountType("amount")}
              className={`h-12 flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${
                discountType === "amount"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>Сума</span>
            </button>
          </div>

          {/* Quick Discounts (only for percentage) */}
          {discountType === "percent" && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Швидкі знижки:</p>
              <div className="grid grid-cols-5 gap-2">
                {quickDiscounts.map((percent) => (
                  <Button
                    key={percent}
                    variant="outline"
                    onClick={() => setDiscountValue(percent.toString())}
                    className="h-10 text-sm"
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {discountType === "percent" ? "Відсоток знижки:" : "Сума знижки:"}
            </label>
            <div className="relative">
              <Input
                type="number"
                value={discountValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percent" ? "Введіть відсоток" : "Введіть суму"}
                className="pr-12"
                min="0"
                max={discountType === "percent" ? "100" : originalAmount.toString()}
                step={discountType === "percent" ? "0.1" : "1"}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                {discountType === "percent" ? "%" : "₴"}
              </div>
            </div>
          </div>

          {/* Preview */}
          {discountValue && !isNaN(Number.parseFloat(discountValue)) && Number.parseFloat(discountValue) > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Сума товарів:</span>
                  <span>{originalAmount.toLocaleString()} ₴</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>
                    Знижка (
                    {discountType === "percent"
                      ? `${Number.parseFloat(discountValue)}%`
                      : `${((Number.parseFloat(discountValue) / originalAmount) * 100).toFixed(1)}%`}
                    ):
                  </span>
                  <span>
                    -
                    {discountType === "percent"
                      ? ((originalAmount * Number.parseFloat(discountValue)) / 100).toLocaleString()
                      : Number.parseFloat(discountValue).toLocaleString()}{" "}
                    ₴
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-blue-300 pt-2">
                  <span>До сплати:</span>
                  <span className="text-green-600">
                    {(
                      originalAmount -
                      (discountType === "percent"
                        ? (originalAmount * Number.parseFloat(discountValue)) / 100
                        : Number.parseFloat(discountValue))
                    ).toLocaleString()}{" "}
                    ₴
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Скасувати
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              !discountValue || isNaN(Number.parseFloat(discountValue)) || Number.parseFloat(discountValue) <= 0
            }
            className="flex-1"
          >
            Застосувати
          </Button>
        </div>
      </div>
    </div>
  )
}
