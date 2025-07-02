import React from "react"

export const StoreType = () => {
  return <React.Fragment />
}

// types.ts
export interface Product {
  id: number
  store_id?: string
  name: string
  category: string
  price: number
  quantity: number
  description?: string
  brand: string
  model: string
  barcode?: string
  created_at: Date
  updatedAt?: Date
}
