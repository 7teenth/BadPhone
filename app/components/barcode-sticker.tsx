"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Printer, Minus, Plus } from "lucide-react";
import JsBarcode from "jsbarcode";
import React from "react";

interface BarcodeStickerProps {
  barcode: string;
  productName: string;
  price: number;
  onClose: () => void;
}

// Компонента кнопки +/- для кількості
interface QuantityButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
}
const QuantityButton = ({ onClick, disabled, icon }: QuantityButtonProps) => (
  <Button variant="outline" size="icon" onClick={onClick} disabled={disabled}>
    {icon}
  </Button>
);

export default function BarcodeSticker({
  barcode,
  productName,
  price,
  onClose,
}: BarcodeStickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [quantity, setQuantity] = useState(1);

  const STICKER_WIDTH_MM = 30;
  const STICKER_HEIGHT_MM = 20;
  const DPI = 300;
  const STICKER_WIDTH_PX = Math.round((STICKER_WIDTH_MM / 25.4) * DPI); // ≈354px
  const STICKER_HEIGHT_PX = Math.round((STICKER_HEIGHT_MM / 25.4) * DPI); // ≈236px

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, STICKER_WIDTH_PX, STICKER_HEIGHT_PX);

    const paddingTop = 20;
    const paddingBottom = 20;
    const availableHeight = STICKER_HEIGHT_PX - paddingTop - paddingBottom;

    const barcodeCanvas = document.createElement("canvas");
    const formattedBarcode = barcode.padStart(12, "0");

    try {
      JsBarcode(barcodeCanvas, formattedBarcode, {
        format: "EAN13",
        width: 2,
        height: availableHeight * 0.65, // трохи менше, щоб текст не налазив
        displayValue: true,
        fontSize: 16,
        margin: 0,
        background: "white",
        lineColor: "black",
      });
    } catch {
      JsBarcode(barcodeCanvas, barcode, {
        format: "CODE128",
        width: 2,
        height: availableHeight * 0.65,
        displayValue: true,
        fontSize: 14,
        margin: 0,
        background: "white",
        lineColor: "black",
      });
    }

    ctx.fillStyle = "black";
    ctx.font = `bold 16px Arial`;
    ctx.textAlign = "center";
    const truncatedName =
      productName.length > 20
        ? productName.substring(0, 18) + "..."
        : productName;
    ctx.fillText(truncatedName, STICKER_WIDTH_PX / 2, paddingTop - 5);

    const barcodeX = (STICKER_WIDTH_PX - barcodeCanvas.width) / 2;
    const barcodeY = paddingTop + (availableHeight - barcodeCanvas.height) / 2;
    ctx.drawImage(barcodeCanvas, barcodeX, barcodeY);

    ctx.font = `bold 18px Arial`;
    ctx.fillText(
      `${price.toFixed(2)} ₴`,
      STICKER_WIDTH_PX / 2,
      STICKER_HEIGHT_PX - 5
    );
  }, [barcode, productName, price, STICKER_WIDTH_PX, STICKER_HEIGHT_PX]);

  const handlePrint = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");

    const stickersHtml = Array(quantity)
      .fill(null)
      .map(
        () => `
      <div style="
        width: ${STICKER_WIDTH_MM}mm;
        height: ${STICKER_HEIGHT_MM}mm;
        display: inline-block;
        page-break-inside: avoid;
        margin: 0;
        padding: 0;
      ">
        <img src="${dataUrl}" style="width: ${STICKER_WIDTH_MM}mm; height: ${STICKER_HEIGHT_MM}mm;" />
      </div>
      `
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Друк штрих-коду</title>
          <style>
            @page { size: ${STICKER_WIDTH_MM}mm ${STICKER_HEIGHT_MM}mm; margin: 0; }
            body { margin: 0; padding: 0; display: flex; flex-wrap: wrap; }
            img { page-break-inside: avoid; margin: 0; display: block; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${stickersHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Друк штрих-коду (30×20 мм)</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-4 p-4 bg-muted rounded-lg">
          <div
            className="border border-border bg-white"
            style={{
              width: `${STICKER_WIDTH_MM}mm`, // без множника 3
              height: `${STICKER_HEIGHT_MM}mm`, // без множника 3
            }}
          >
            <canvas
              ref={canvasRef}
              width={STICKER_WIDTH_PX}
              height={STICKER_HEIGHT_PX}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>

        {/* Quantity selector */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-sm font-medium">Кількість:</span>
          <div className="flex items-center gap-2">
            <QuantityButton
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              icon={<Minus className="h-4 w-4" />}
            />
            <Input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(
                    1,
                    Math.min(100, Number.parseInt(e.target.value) || 1)
                  )
                )
              }
              className="w-20 text-center"
            />
            <QuantityButton
              onClick={() => setQuantity((q) => Math.min(100, q + 1))}
              disabled={quantity >= 100}
              icon={<Plus className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4 text-center">
          <p>Штрих-код: {barcode}</p>
          <p>
            Розмір стікера: {STICKER_WIDTH_MM}×{STICKER_HEIGHT_MM} мм
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent"
          >
            Скасувати
          </Button>
          <Button onClick={handlePrint} className="flex-1 gap-2">
            <Printer className="h-4 w-4" />
            Друкувати ({quantity} шт.)
          </Button>
        </div>
      </div>
    </div>
  );
}
