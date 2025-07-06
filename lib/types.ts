import React from "react"



// types.ts
export interface Product {
  id: string // или number, выбери один тип и используй его везде
  store_id?: string | null
  name: string
  category: string
  price: number
  purchasePrice?: number
  quantity: number
  description?: string
  brand: string
  model: string
  barcode?: string
  created_at: string // лучше string, если работаешь с ISO датами
  updatedAt?: string
}

