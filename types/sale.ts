export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  cartQuantity: number
  brand: string
  model: string
  description?: string
  created_at?: string
  barcode?: string
}

export interface Sale {
  id: number
  items: CartItem[]
  total: number
  date: Date
  receiptNumber: string
  payment_method: "cash" | "terminal"
  discount?: number
  store_id: string | null
}

// Тип для створення нового продажу (без id і дати)
export interface SaleInput {
  receipt_number: string
  total_amount: number
  discount?: number
  items_data: {
    product_id: string
    quantity: number
    name: string
    price: number
    brand: string
    model: string
  }[]
  payment_method: "cash" | "terminal"
  seller_id?: string
  store_id: string | null
}

