import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
  store_id?: string // Сделаем опциональным для владельцев без привязки к магазину
  login: string
  name: string
  role: "owner" | "seller"
  password_hash: string // Добавляем поле для хеша пароля
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
  items_data: SaleItem[]
  payment_method: "cash" | "terminal"
  created_at: string
  seller?: User
}

export interface SaleItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
  total: number
  brand?: string
  model?: string
}

export interface Visit {
  id: string
  store_id: string
  seller_id?: string
  title: string
  sale_amount: number
  created_at: string
  sale_id?: string | null // Может быть null если продажа не завершена
  seller?: User
}

export interface Shift {
  id: string
  store_id?: string // Опциональный для глобальных смен
  user_id: string
  start_time: string
  end_time?: string | null
  total_sales: number
  created_at: string
  user?: User
}

// Дополнительные типы для UI
export interface CartItem extends Product {
  cartQuantity: number
}

export interface ShiftStats {
  start: Date
  end: Date
  totalAmount: number
  cashAmount: number
  terminalAmount: number
  count: number
  totalItems: number
  avgCheck: number
}

export interface DailySalesStats {
  date: string
  salesCount: number
  totalAmount: number
  sellers: {
    [sellerId: string]: {
      name: string
      amount: number
      salesCount: number
    }
  }
}

export interface TotalStats {
  totalRevenue: number
  totalSales: number
  averageSale: number
  topSellingAmount: number
  topSellingDay: string
  cashAmount: number
  terminalAmount: number
}

// Типы для форм
export interface LoginFormData {
  login: string
  password: string
  storeId: string
}

export interface RegisterFormData {
  login: string
  password: string
  name: string
  role: "owner" | "seller"
  storeId?: string | null
}

export interface ProductFormData {
  name: string
  category: string
  price: number
  quantity: number
  description?: string
  brand: string
  model: string
  barcode?: string
  store_id: string
}

export interface StoreFormData {
  name: string
  address?: string
  phone?: string
}

// Типы для фильтров и поиска
export interface ProductFilters {
  searchTerm: string
  category: string
  brand: string
  sortBy: "name" | "price-asc" | "price-desc" | "quantity" | "date"
  inStock?: boolean
}

export interface SalesFilters {
  searchTerm: string
  paymentMethod: "all" | "cash" | "terminal"
  dateRange: "today" | "yesterday" | "week" | "month" | "all"
  sellerId?: string
  storeId?: string
}

export interface UserFilters {
  searchTerm: string
  role: "all" | "owner" | "seller"
  storeId: "all" | "no-store" | string
}

// Типы для API ответов
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Типы для контекста приложения
export interface AppContextType {
  // Состояние
  currentTime: string
  sales: Sale[]
  visits: Visit[]
  products: Product[]
  users: User[]
  stores: Store[]
  currentShift: Shift | null
  totalSalesAmount: number
  workingHours: number
  workingMinutes: number
  currentUser: User | null
  currentStore: Store | null
  currentStoreId: string | null
  isAuthenticated: boolean
  isOnline: boolean

  // Методы
  addSale: (sale: Omit<Sale, "id" | "store_id" | "created_at">) => Promise<void>
  addProduct: (
    product: Omit<Product, "id" | "created_at" | "updated_at"> & { store_id?: string | null },
  ) => Promise<void>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  startShift: () => Promise<void>
  endShift: () => Promise<void>
  isShiftActive: boolean
  getHourlyEarnings: () => number
  login: (login: string, password: string, selectedStoreId: string) => Promise<boolean>
  logout: () => void
  register: (
    login: string,
    password: string,
    name: string,
    role: "owner" | "seller",
    storeId: string | null,
  ) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
  getDailySalesStats: () => DailySalesStats[]
  getTotalStats: () => TotalStats
  getShiftStats: () => ShiftStats | null
  loadData: (user: User | null) => Promise<void>
  refreshVisits?: () => Promise<void>
}

// Константы для категорий товаров
export const PRODUCT_CATEGORIES = [
  "Захисне скло",
  "Чохли",
  "Зарядні пристрої",
  "Навушники",
  "PowerBank",
  "Годинник",
  "Колонки",
  "Компʼютерна периферія",
  "Автомобільні аксесуари",
  "Освітлення",
  "Різне",
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

// Константы для способов оплаты
export const PAYMENT_METHODS = {
  cash: "Готівка",
  terminal: "Термінал",
} as const

export type PaymentMethod = keyof typeof PAYMENT_METHODS

// Константы для ролей пользователей
export const USER_ROLES = {
  owner: "Власник",
  seller: "Продавець",
} as const

export type UserRole = keyof typeof USER_ROLES

// Константы для сортировки
export const SORT_OPTIONS = {
  name: "За назвою",
  "price-asc": "Ціна: зростання",
  "price-desc": "Ціна: спадання",
  quantity: "За кількістю",
  date: "За датою",
} as const

export type SortOption = keyof typeof SORT_OPTIONS

// Утилитарные типы
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Типы для валидации
export interface ValidationError {
  field: string
  message: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Типы для уведомлений
export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  timestamp: Date
  read: boolean
}

// Типы для настроек приложения
export interface AppSettings {
  theme: "light" | "dark" | "system"
  language: "uk" | "en"
  currency: "UAH" | "USD" | "EUR"
  dateFormat: "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD"
  timeFormat: "24h" | "12h"
  autoLogout: number // минуты
  soundEnabled: boolean
  notificationsEnabled: boolean
}

// Типы для отчетов
export interface SalesReport {
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalSales: number
    totalRevenue: number
    averageCheck: number
    topProducts: Array<{
      name: string
      quantity: number
      revenue: number
    }>
    paymentMethods: {
      cash: number
      terminal: number
    }
  }
  dailyBreakdown: Array<{
    date: string
    sales: number
    revenue: number
  }>
  sellerPerformance: Array<{
    sellerId: string
    sellerName: string
    sales: number
    revenue: number
  }>
}

export interface InventoryReport {
  totalProducts: number
  totalValue: number
  lowStockItems: Product[]
  outOfStockItems: Product[]
  categoryBreakdown: Array<{
    category: string
    count: number
    value: number
  }>
}


