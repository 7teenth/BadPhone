"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmDialogUserProps {
  user: any
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialogUser({
  user,
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogUserProps) {
  const [confirmText, setConfirmText] = useState("")
  const [confirmChecked, setConfirmChecked] = useState(false)

  const expectedConfirmText = "ВИДАЛИТИ"
  const isConfirmValid = confirmText === expectedConfirmText && confirmChecked

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isConfirmValid) {
      handleConfirm()
    }
    if (e.key === "Escape") {
      onCancel()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4 flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="confirm-text-input">Введіть {expectedConfirmText}:</Label>
            <Input
              id="confirm-text-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm-checkbox"
              checked={confirmChecked}
              onCheckedChange={(checked) => setConfirmChecked(checked === true)}
            />
            <Label htmlFor="confirm-checkbox" className="select-none cursor-pointer">
              Підтвердити видалення
            </Label>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onCancel}>
              Відміна
            </Button>
            <Button
              variant="destructive"
              disabled={!isConfirmValid}
              onClick={handleConfirm}
            >
              Видалити
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
