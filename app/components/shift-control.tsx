"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { useApp } from "../context/app-context"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export function ShiftControl() {
  const {
    isShiftActive,
    workingHours,
    workingMinutes,
    sales,
    currentShift,
    endShift,
  } = useApp()

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Фільтруємо продажі у поточній зміні
  const shiftSales = useMemo(() => {
    if (!currentShift) return []
    const shiftStart = new Date(currentShift.start_time).getTime()
    return sales.filter((sale) => {
      const saleTime = new Date(sale.created_at).getTime()
      if (currentShift.end_time) {
        const shiftEnd = new Date(currentShift.end_time).getTime()
        return saleTime >= shiftStart && saleTime <= shiftEnd
      }
      return saleTime >= shiftStart
    })
  }, [sales, currentShift])

  const totalSalesAmount = useMemo(() => {
    return shiftSales.reduce((sum, sale) => sum + sale.total_amount, 0)
  }, [shiftSales])

  const salesCount = shiftSales.length

  // 🔸 Окремі підсумки по способам оплати
  const cashTotal = shiftSales
    .filter((s) => s.payment_method === "cash")
    .reduce((sum, s) => sum + s.total_amount, 0)

  const terminalTotal = shiftSales
    .filter((s) => s.payment_method === "terminal")
    .reduce((sum, s) => sum + s.total_amount, 0)

  const handleCloseShiftClick = () => {
    setIsDialogOpen(true)
  }

  const handleConfirmClose = async () => {
    await endShift()
    setIsDialogOpen(false)
  }

  if (!isShiftActive) return null

  return (
    <>
      <Button
        variant="destructive"
        onClick={handleCloseShiftClick}
        className="flex items-center gap-2"
      >
        Закінчити зміну
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Підсумки зміни</DialogTitle>
          </DialogHeader>

          <Card>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">Час на зміні: </span>
                {workingHours} год. {workingMinutes} хв.
              </div>
              <div>
                <span className="font-semibold">Загальна сума продажів: </span>
                {totalSalesAmount.toLocaleString()} грн.
              </div>
              <div>
                <span className="font-semibold">Готівка: </span>
                {cashTotal.toLocaleString()} грн.
              </div>
              <div>
                <span className="font-semibold">Термінал: </span>
                {terminalTotal.toLocaleString()} грн.
              </div>
              <div>
                <span className="font-semibold">Кількість продажів: </span>
                {salesCount}
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Відмінити
            </Button>
            <Button variant="destructive" onClick={handleConfirmClose}>
              Підтвердити закриття
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
