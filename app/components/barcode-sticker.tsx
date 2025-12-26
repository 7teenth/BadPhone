"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Barcode from "react-barcode";

interface Props {
  barcode: string;
  productName: string;
  price: number; // можно оставить, если используется где-то ещё
  onClose: () => void;
}

export default function BarcodeSticker({
  barcode,
  productName,
  onClose,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print</title>
          <style>
            @page {
              size: 40mm 25mm;
              margin: 0;
            }

            body {
              margin: 0;
              width: 40mm;
              height: 25mm;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
            }

            .sticker {
              width: 40mm;
              height: 25mm;
              box-sizing: border-box;

              padding-top: 1mm;
              padding-right: 2mm;
              padding-bottom: 1mm;
              padding-left: 0mm;

              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;

              /* если нужно ещё левее */
              transform: translateX(-3mm);
            }

            .product-name {
              font-size: 6pt;
              font-weight: bold;
              text-align: center;
              line-height: 1.1;
              max-height: 6mm;
              overflow: hidden;
            }

            .brand {
              font-size: 6pt;
              font-weight: bold;
              line-height: 1;
            }

            svg {
              width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${printRef.current.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded shadow-lg p-3 relative">
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>

        {/* ПРЕВЬЮ */}
<div
  className="sticker-preview border"
  style={{
    width: "320px",   // 40mm → масштаб 4×
    height: "200px",  // 25mm → масштаб 4×
    paddingTop: "4px",
    paddingRight: "8px",
    paddingBottom: "4px",
    paddingLeft: "0px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    boxSizing: "border-box",
  }}
>
  {/* Название продукта */}
  <div
    style={{
      fontSize: "18pt",
      fontWeight: "bold",
      textAlign: "center",
      lineHeight: 1.1,
      maxHeight: "40px",
      overflow: "hidden",
      width: "100%",
    }}
  >
    {productName}
  </div>

  {/* Штрихкод */}
  <div style={{ width: "100%", flexShrink: 0 }}>
    <Barcode
      value={barcode}
      format="EAN13"
      width={2.7}
      height={40}
      displayValue
      fontSize={8}
      margin={0}
    />
  </div>

  {/* Бренд / BadPhone */}
  <div
    style={{
      fontSize: "18pt",
      fontWeight: "bold",
      lineHeight: 1,
      width: "100%",
      textAlign: "center",
    }}
  >
    BadPhone
  </div>
</div>


        {/* КНОПКИ */}
        <div className="flex justify-end mt-3 gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Закрити
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handlePrint}
          >
            Друк
          </Button>
        </div>
      </div>
    </div>
  );
}
