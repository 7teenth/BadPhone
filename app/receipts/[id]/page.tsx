import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { qrToDataUrl, formatDateTime, formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Props = { params: { id: string } };

export default async function Page({ params }: Props) {
  const id = params.id;

  // fetch sale
  const { data: sale, error } = await supabase
    .from("sales")
    .select(
      "id, total_amount, items_data, payment_method, created_at, store_id, receipt_number"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !sale) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold">Чек не знайдено</h2>
        <p className="text-sm text-gray-600 mt-2">
          Запитуваний чек не знайдено або недоступний.
        </p>
      </div>
    );
  }

  // get store details if available
  let store = null;
  if (sale.store_id) {
    const { data: s } = await supabase
      .from("stores")
      .select("name,address,phone")
      .eq("id", sale.store_id)
      .maybeSingle();
    store = s || null;
  }

  // receipt URL
  const receiptUrl = `${
    process.env.NEXT_PUBLIC_APP_URL ?? ""
  }/receipts/${encodeURIComponent(id)}`;

  // generate QR data URL server-side via shared util
  let qrData = "";
  try {
    qrData = await qrToDataUrl(receiptUrl, { width: 240 });
  } catch (e) {
    console.warn("QR generation failed", e);
  }

  const items = Array.isArray(sale.items_data)
    ? sale.items_data
    : JSON.parse(sale.items_data || "[]");

  const formattedDate = formatDateTime(sale.created_at);

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow max-w-xl w-full border border-gray-200">
        <div className="text-center mb-4">
          <img src="/check.png" alt="logo" className="mx-auto h-16 mb-2" />
          <h1 className="text-lg font-bold">Фіскальний чек</h1>
          {store && (
            <div className="text-sm text-gray-600 mt-1">
              {store.name} • {store.address || ""} • {store.phone || ""}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-700 mb-4">
          <div>
            Чек № <strong>{sale.id}</strong>
          </div>
          <div>Дата: {formattedDate}</div>
          {sale.receipt_number && (
            <div>Касовий номер: {sale.receipt_number}</div>
          )}
        </div>

        <div className="divide-y divide-gray-200 border rounded-md overflow-hidden">
          {items.map((it: any, idx: number) => (
            <div key={idx} className="flex justify-between p-3">
              <div>
                <div className="font-medium">
                  {it.product_name || it.name || "Товар"}{" "}
                  {it.brand ? `(${it.brand})` : ""}
                </div>
                <div className="text-xs text-gray-500">
                  {it.quantity} × {formatCurrency(Number(it.price))} —{" "}
                  {formatCurrency(Number(it.total))}
                </div>
              </div>
              <div className="text-right font-semibold">
                {formatCurrency(Number(it.total))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-700 font-bold">Загалом</div>
          <div className="text-lg font-bold">
            {formatCurrency(Number(sale.total_amount))}
          </div>
        </div>

        {sale.payment_method && (
          <div className="text-center text-sm text-gray-600 mt-2">
            Спосіб оплати:{" "}
            {sale.payment_method === "cash"
              ? "Готівка"
              : sale.payment_method === "terminal"
              ? "Термінал"
              : sale.payment_method}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-gray-500">Дякуємо за покупку!</div>
          {qrData ? (
            <img src={qrData} alt="qr" className="h-20 w-20" />
          ) : (
            <div className="text-xs text-gray-400">Посилання: {receiptUrl}</div>
          )}
        </div>
      </div>
    </div>
  );
}
