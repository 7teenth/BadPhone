import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://swyffpttmarbccxeqqlo.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eWZmcHR0bWFyYmNjeGVxcWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNDEyMDYsImV4cCI6MjA2NjcxNzIwNn0.Fv3ETh0lspRpWSJEQwTIsPjPPd5ilglJ_5U3kdt6G5s"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для базы данных
export interface Store {
  id: string
  name: string
  address?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  store_id: string
  login: string
  name: string
  role: "owner" | "seller"
  created_at: string
  updated_at: string
  store?: Store
}

export interface Product {
  id: string
  store_id: string
  name: string
  category: string
  price: number
  quantity: number
  description?: string
  brand: string
  model: string
  barcode?: string
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  store_id: string
  seller_id?: string
  receipt_number: string
  total_amount: number
  items_data: any[]
  payment_method: "cash" | "terminal"
  created_at: string
  seller?: User
}

export interface Visit {
  id: string
  store_id: string
  seller_id?: string
  title: string
  sale_amount: number
  created_at: string
  seller?: User
}

export interface Shift {
  id: string
  store_id: string
  user_id: string
  start_time: string
  end_time?: string
  total_sales: number
  created_at: string
  user?: User
}
