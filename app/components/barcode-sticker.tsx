"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Barcode from "react-barcode";

interface Props {
  barcode: string;
  productName: string;
  onClose: () => void;
}

export default function BarcodeSticker({ barcode, productName, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Sticker</title>
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
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              padding: 1mm 2mm 1mm 0;
              box-sizing: border-box;
              transform: translateX(-3mm);
            }
            .product-name {
              font-size: 6pt;
              font-weight: bold;
              text-align: center;
              line-height: 1.1;
              max-height: 6mm;
              overflow: hidden;
              margin-left: 3mm;
            }
            .brand {
              font-size: 6pt;
              font-weight: bold;
              text-align: center;
              margin-left: 3mm;
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
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded shadow-lg p-3 relative">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>

        {/* Превью стикера */}
        <div
          ref={printRef}
          className="sticker border"
          style={{
            width: "60mm",
            height: "25mm",
            padding: "1mm 2mm 1mm 0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="product-name">{productName}</div>

          <Barcode
            value={barcode}
            format="EAN13"
            width={2}
            height={30}
            displayValue
            fontSize={6}
            margin={0}
          />

          <div className="brand">BadPhone</div>
        </div>

        {/* Кнопки */}
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
