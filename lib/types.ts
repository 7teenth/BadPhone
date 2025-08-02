export interface Product {
  id: string;
  store_id?: string | null;
  name: string;
  category: string;
  price: number;
  purchasePrice?: number;
  quantity: number;
  description?: string;
  brand: string;
  model: string;
  barcode?: string;
  created_at: string;
  updatedAt?: string;
}

export type SaleItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  brand: string;
  model: string;
};

export interface SaleInput {
  receipt_number: string;
  total_amount: number;
  discount?: number;
  items_data: SaleItem[];
  payment_method: "cash" | "terminal";
  seller_id?: string;
  store_id: string | null;
}

