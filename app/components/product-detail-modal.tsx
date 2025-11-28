"use client";

import React from "react";

export default function ProductDetailModal({
  isOpen,
  product,
  onClose,
}: {
  isOpen: boolean;
  product: any | null;
  onClose: () => void;
}) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-xl p-6 max-h-[90vh] overflow-auto shadow-xl">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold">{product.name}</h3>
            <div className="text-sm text-gray-500 mt-1">
              {product.brand} {product.model}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {(product.price || 0).toLocaleString()} ₴
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Штрих-код: {product.barcode || "—"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">Опис</div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
              {product.description || "Немає опису"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Склад</div>
            <div className="text-sm font-medium text-gray-900">
              {product.quantity ?? 0} шт
            </div>
            <div className="text-xs text-gray-500 mt-3">
              Категорія: {product.category || "—"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Магазин: {product.store_id || "Локальний"}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
