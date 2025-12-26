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

    // Create a hidden iframe to avoid opening a new tab/window
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    iframe.setAttribute("aria-hidden", "true");

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`
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
              margin-left: 4mm;
            }

            .brand {
              font-size: 6pt;
              font-weight: bold;
              line-height: 1;
              margin-left: 4mm;
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

    const printAndCleanup = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Printing failed:", e);
      } finally {
        setTimeout(() => {
          try {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          } catch {}
        }, 500);
      }
    };

    // If the iframe document is already ready, print immediately, otherwise wait for onload
    const win = iframe.contentWindow;
    if (win && win.document && win.document.readyState === "complete") {
      printAndCleanup();
    } else {
      iframe.onload = printAndCleanup;
      // Fallback: ensure printing after a short delay
      setTimeout(printAndCleanup, 1000);
    }
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
          ref={printRef}
          className="sticker border"
          style={{
            width: "40mm",
            height: "25mm",
            paddingTop: "1mm",
            paddingRight: "2mm",
            paddingBottom: "1mm",
            paddingLeft: "0mm",
          }}
        >
          <div className="product-name">{productName}</div>

          <Barcode
            value={barcode}
            format="EAN13"
            width={1.35}
            height={20}
            displayValue
            fontSize={8}
            margin={0}
          />

          {/* ВМЕСТО ЦЕНЫ */}
          <div className="brand">BadPhone</div>
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
