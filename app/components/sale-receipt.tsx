"use client";

import React from "react";
import { useApp } from "@/app/context/app-context";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import {
  formatCurrency as _formatCurrency,
  formatDateTime,
  escapeHtml as _escapeHtml,
  getItemQuantity as _getItemQuantity,
  getUnitPrice as _getUnitPrice,
  safeItemTotal as _safeItemTotal,
  qrToDataUrl,
} from "@/lib/utils";

interface SaleItem {
  id: string;
  name?: string;
  product_name?: string;
  brand?: string;
  quantity?: number;
  cartQuantity?: number;
  price?: number;
  unit_price?: number;
  total?: number;
}

interface SaleReceiptProps {
  sale: {
    id?: string;
    created_at?: string;
    total?: number;
    paymentMethod?: string; // e.g., "Готівка" or "Термінал"
    items?: SaleItem[];
  };
  onNewSale: () => void;
  onBack: () => void;
}

export default function SaleReceipt({
  sale,
  onNewSale,
  onBack,
}: SaleReceiptProps) {
  const { currentStore, currentUser } = useApp();
  const formatCurrency = _formatCurrency;
  const getItemQuantity = _getItemQuantity;
  const safeItemTotal = _safeItemTotal;
  const getUnitPrice = _getUnitPrice;

  const computedTotal = (sale.items || []).reduce(
    (acc, it) => acc + safeItemTotal(it),
    0
  );

  const saleTotal =
    sale.total != null && !isNaN(sale.total) ? sale.total : computedTotal;

  const formattedDate = formatDateTime(sale.created_at);

  const escapeHtml = _escapeHtml;

  const storeName = currentStore?.name ?? "";
  const storeAddress = currentStore?.address ?? "";
  const storePhone = currentStore?.phone ?? "";
  const cashier = currentUser?.name ?? currentUser?.login ?? "";

  // generate QR images locally using the 'qrcode' package
  // NOTE: import at top dynamically so it's only loaded client-side when needed
  const handlePrint = async () => {
    const printWindow = window.open("", "_blank", "width=350,height=800");
    if (!printWindow) return;

    const getUnitPrice = (item: SaleItem) => item.price ?? item.unit_price ?? 0;

    const receiptUrl = `${window.location.origin}/receipts/${encodeURIComponent(
      String(sale.id)
    )}`;
    // use provided logo from public folder
    const logoUrl = `${window.location.origin}/check.png`;

    // generate QR as data URL locally (no external calls)
    const qrData = (await qrToDataUrl(receiptUrl, { width: 180 })) || "";

    const itemsHtml = (sale.items || [])
      .map(
        (item) => `
      <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:14px;">
        <span>${item.name ?? item.product_name ?? "Товар"}$
          ${item.brand ? ` (${item.brand})` : ""} × ${getItemQuantity(
          item
        )} — ${escapeHtml(formatCurrency(getUnitPrice(item)))}</span>
        <span>${escapeHtml(formatCurrency(safeItemTotal(item)))}</span>
      </div>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Чек ${sale.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; padding:20px; color:#111827; }
            .receipt { max-width:400px; margin:0 auto; padding:12px; border:1px solid #e5e7eb; }
            .title { text-align:center; font-size:18px; font-weight:700; margin-bottom:6px; }
            .line { border-top:1px dashed #9ca3af; margin:10px 0; }
            .totals { display:flex; justify-content:space-between; font-weight:700; font-size:15px; margin-top:6px; }
            .payment { text-align:center; margin-top:8px; font-size:14px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div style="text-align:center; margin-bottom:6px;">
              <img src="${logoUrl}" alt="logo" style="max-height:64px; max-width:220px; display:block; margin:0 auto 8px;" />
              <div style="font-weight:800; font-size:18px; letter-spacing:0.4px;">${escapeHtml(
                storeName
              )}</div>
              <div style="font-size:12px; color:#374151;">${escapeHtml(
                storeAddress
              )}</div>
              <div style="font-size:12px; color:#374151;">${escapeHtml(
                storePhone
              )}</div>
            </div>
            <div class="title">Фіскальний чек</div>
            <div>Чек №: ${escapeHtml(String(sale.id))}<br/>Дата: ${escapeHtml(
      formattedDate
    )}</div>
            <div class="line"></div>
            ${itemsHtml}
            <div class="line"></div>
            <div class="totals">
              <span>Загалом:</span>
              <span>${escapeHtml(formatCurrency(saleTotal))} ₴</span>
            </div>
            ${
              sale.paymentMethod
                ? `<div class="payment">Спосіб оплати: ${escapeHtml(
                    String(sale.paymentMethod)
                  )}</div>`
                : ""
            }
            <div class="line"></div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:6px;">
              <div style="font-size:11px; color:#6b7280;">Дякуємо за покупку!</div>
              <div style="text-align:right;">
                ${
                  qrData
                    ? `<img src="${qrData}" alt="qr" style="width:88px; height:88px; object-fit:contain; border-radius:6px;" />`
                    : `<div style="font-size:11px;color:#9ca3af;">${escapeHtml(
                        receiptUrl
                      )}</div>`
                }
                <div style="font-size:10px; color:#9ca3af; margin-top:4px;">${escapeHtml(
                  String(sale.id)
                )}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const lines: string[] = [];
    lines.push(storeName);
    if (storeAddress) lines.push(storeAddress);
    if (storePhone) lines.push(`Контакти: ${storePhone}`);
    lines.push(`Чек № ${sale.id}`);
    lines.push(`Дата: ${formattedDate}`);
    // include link to online receipt view (if available)
    try {
      const receiptUrl = `${
        window.location.origin
      }/receipts/${encodeURIComponent(String(sale.id))}`;
      lines.push(`Посилання: ${receiptUrl}`);
    } catch (e) {
      // ignore if window not available
    }
    lines.push("");

    (sale.items || []).forEach((item, idx) => {
      const lineTotal = safeItemTotal(item);
      const unit = getUnitPrice(item);
      lines.push(
        `${idx + 1}. ${item.name ?? item.product_name ?? "Товар"}${
          item.brand ? ` (${item.brand})` : ""
        } x${getItemQuantity(item)} — ${formatCurrency(
          unit
        )} шт — ${formatCurrency(lineTotal)}`
      );
    });

    lines.push("");
    lines.push(`Загалом: ${formatCurrency(saleTotal)}`);
    if (sale.paymentMethod) {
      lines.push(`Спосіб оплати: ${sale.paymentMethod}`);
    }
    lines.push("");
    lines.push("Дякуємо за покупку!");

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${sale.id || Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
        Продаж завершено
      </h2>

      <p className="text-center text-gray-600 mb-4">
        Продаж № <span className="font-medium">{sale.id}</span> від{" "}
        <span className="font-medium">{formattedDate}</span>
      </p>

      <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
        {(sale.items || []).map((item) => (
          <div
            key={item.id}
            className="flex justify-between py-2 border-b border-gray-200 last:border-b-0"
          >
            <div>
              <div className="font-medium">
                {item.name ?? item.product_name ?? "Товар"}{" "}
                {item.brand ? `(${item.brand})` : ""} × {getItemQuantity(item)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(getUnitPrice(item))} за шт —{" "}
                {formatCurrency(safeItemTotal(item))} загалом
              </div>
            </div>
            <div className="font-semibold text-sm">
              {formatCurrency(getUnitPrice(item))}
            </div>
          </div>
        ))}

        <div className="mt-4 border-t border-gray-300 pt-3">
          <div className="flex justify-between text-lg font-bold text-gray-800">
            <span>Загалом:</span>
            <span>{formatCurrency(saleTotal)}</span>
          </div>

          {sale.paymentMethod && (
            <p className="mt-2 text-center text-sm text-gray-600 font-medium">
              Спосіб оплати: {sale.paymentMethod}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <button
          onClick={handlePrint}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
        >
          Друкувати чек
        </button>

        <button
          onClick={handleDownload}
          className="flex-1 px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition"
        >
          Завантажити чек
        </button>

        <button
          onClick={onNewSale}
          className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"
        >
          Новий продаж
        </button>

        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 bg-gray-400 text-white font-semibold rounded-md hover:bg-gray-500 transition"
        >
          Назад
        </button>
      </div>
    </div>
  );
}
