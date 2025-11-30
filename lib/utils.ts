// Shared utilities used across components
import { format } from "date-fns";
import { uk } from "date-fns/locale";

export const formatCurrency = (n: number | null | undefined) => {
  const val = Number(n ?? 0) || 0;
  // Keep consistent formatting across app: uk-UA + currency symbol
  return val.toLocaleString("uk-UA") + " ₴";
};

export const formatDateTime = (iso?: string | Date) => {
  if (!iso) return "н/д";
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return format(d, "dd MMMM yyyy, HH:mm", { locale: uk });
  } catch (e) {
    return String(iso);
  }
};

export const escapeHtml = (s: unknown) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

// Sale item helpers — tolerant to different shapes seen in the app
export type AnyItem = {
  id?: string;
  name?: string;
  product_name?: string;
  brand?: string;
  quantity?: number;
  cartQuantity?: number;
  price?: number;
  unit_price?: number;
  total?: number;
};

export const getItemQuantity = (item: AnyItem) =>
  item.quantity ?? item.cartQuantity ?? 0;

export const getUnitPrice = (item: AnyItem) => item.price ?? item.unit_price ?? 0;

export const safeItemTotal = (item: AnyItem) =>
  item.total ?? (getUnitPrice(item) || 0) * getItemQuantity(item);

// QR helper — dynamic import client-side, and server can `require` the package
export async function qrToDataUrl(url: string, opts: { width?: number } = {}) {
  try {
    // dynamic import so bundlers only include it when used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const QRCode: any = await import("qrcode");
    return await QRCode.toDataURL(url, { width: opts.width ?? 180 });
  } catch (err) {
    console.warn("qrToDataUrl failed", err);
    return "";
  }
}

export default {
  formatCurrency,
  formatDateTime,
  escapeHtml,
  getItemQuantity,
  getUnitPrice,
  safeItemTotal,
  qrToDataUrl,
};
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
