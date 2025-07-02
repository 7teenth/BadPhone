// types/sale.ts
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  cartQuantity: number
  brand: string
  model: string
  description?: string
  created_at?: string // якщо потрібно
}

export interface Sale {
  id: number
  items: CartItem[]
  total: number
  date: Date
  receiptNumber: string
  payment_method: "cash" | "terminal"
}
