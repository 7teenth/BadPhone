"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

interface User {
  id: string
  store_id?: string
  login: string
  name: string
  role: "super_admin" | "store_manager" | "seller"
  created_at: string
  updated_at: string
  store?: Store
}

interface Store {
  id: string
  name: string
  address?: string
  phone?: string
  created_at: string
  updated_at: string
}

interface Product {
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

interface Sale {
  id: string
  store_id: string
  seller_id?: string
  receipt_number: string
  total_amount: number
  payment_method: "cash" | "terminal"
  items_data: any[]
  created_at: string
  seller?: User
}

interface Visit {
  id: string
  store_id: string
  seller_id?: string
  title: string
  sale_amount: number
  created_at: string
  seller?: User
}

interface Shift {
  id: string
  store_id: string
  user_id: string
  start_time: string
  end_time?: string
  total_sales: number
  created_at: string
  user?: User
}

interface AppState {
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
  isAuthenticated: boolean
  isOnline: boolean
}

interface AppContextType extends AppState {
  addSale: (sale: Omit<Sale, "id" | "store_id" | "created_at">) => Promise<void>
  addProduct: (product: Omit<Product, "id" | "store_id" | "created_at" | "updated_at">) => Promise<void>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  startShift: () => Promise<void>
  endShift: () => Promise<void>
  isShiftActive: boolean
  getHourlyEarnings: () => number
  login: (login: string, password: string) => Promise<boolean>
  logout: () => void
  register: (
    login: string,
    password: string,
    name: string,
    role: "store_manager" | "seller",
    storeId: string,
  ) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
  getDailySalesStats: () => any[]
  getTotalStats: () => any
  loadData: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState("")
  const [sales, setSales] = useState<Sale[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [totalSalesAmount, setTotalSalesAmount] = useState(0)
  const [workingHours, setWorkingHours] = useState(0)
  const [workingMinutes, setWorkingMinutes] = useState(0)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentStore, setCurrentStore] = useState<Store | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Проверка подключения к интернету
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Обновление времени каждую секунду
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("uk-UA", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Обновление рабочего времени
  useEffect(() => {
    if (!currentShift) {
      setWorkingHours(0)
      setWorkingMinutes(0)
      return
    }

    const updateWorkingTime = () => {
      const now = new Date()
      const startTime = new Date(currentShift.start_time)
      const diffMs = now.getTime() - startTime.getTime()
      const totalMinutes = Math.floor(diffMs / (1000 * 60))
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      setWorkingHours(hours)
      setWorkingMinutes(minutes)
    }

    updateWorkingTime()
    const interval = setInterval(updateWorkingTime, 60000)
    return () => clearInterval(interval)
  }, [currentShift])

  // Загрузка данных при аутентификации
  useEffect(() => {
    if (isAuthenticated && isOnline) {
      loadData()
    }
  }, [isAuthenticated, isOnline])

  const loadData = async () => {
    if (!isOnline) return

    try {
      // Загружаем все магазины
      const { data: storesData } = await supabase.from("stores").select("*")
      if (storesData) setStores(storesData)

      // Загружаем пользователей без join
      const { data: usersData } = await supabase.from("users").select("*")
      if (usersData) {
        // Добавляем информацию о магазинах к пользователям
        const usersWithStores = usersData.map((user) => {
          const store = storesData?.find((s) => s.id === user.store_id)
          return { ...user, store }
        })
        setUsers(usersWithStores)
      }

      // Если у пользователя есть магазин или он супер-админ, загружаем данные
      if (currentUser) {
        if (currentUser.role === "super_admin") {
          // Супер-админ видит все
          const { data: productsData } = await supabase.from("products").select("*")
          const { data: salesData } = await supabase.from("sales").select("*")
          const { data: visitsData } = await supabase.from("visits").select("*")

          if (productsData) setProducts(productsData)
          if (salesData) {
            // Добавляем информацию о продавцах
            const salesWithSellers = salesData.map((sale) => {
              const seller = usersData?.find((u) => u.id === sale.seller_id)
              return { ...sale, seller }
            })
            setSales(salesWithSellers)
          }
          if (visitsData) {
            // Добавляем информацию о продавцах
            const visitsWithSellers = visitsData.map((visit) => {
              const seller = usersData?.find((u) => u.id === visit.seller_id)
              return { ...visit, seller }
            })
            setVisits(visitsWithSellers)
          }
        } else if (currentUser.store_id) {
          // Обычные пользователи видят только свой магазин
          const { data: productsData } = await supabase
            .from("products")
            .select("*")
            .eq("store_id", currentUser.store_id)
          const { data: salesData } = await supabase.from("sales").select("*").eq("store_id", currentUser.store_id)
          const { data: visitsData } = await supabase.from("visits").select("*").eq("store_id", currentUser.store_id)

          if (productsData) setProducts(productsData)
          if (salesData) {
            // Добавляем информацию о продавцах
            const salesWithSellers = salesData.map((sale) => {
              const seller = usersData?.find((u) => u.id === sale.seller_id)
              return { ...sale, seller }
            })
            setSales(salesWithSellers)
          }
          if (visitsData) {
            // Добавляем информацию о продавцах
            const visitsWithSellers = visitsData.map((visit) => {
              const seller = usersData?.find((u) => u.id === visit.seller_id)
              return { ...visit, seller }
            })
            setVisits(visitsWithSellers)
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const login = async (login: string, password: string): Promise<boolean> => {
    if (!isOnline) return false

    try {
      // Простой запрос без join для избежания проблем с RLS
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("login", login)
        .eq("password_hash", password)
        .single()

      if (userError || !userData) {
        console.error("Login error:", userError)
        return false
      }

      // Отдельно получаем информацию о магазине если есть store_id
      let storeData = null
      if (userData.store_id) {
        const { data: store } = await supabase.from("stores").select("*").eq("id", userData.store_id).single()

        storeData = store
      }

      const userWithStore = {
        ...userData,
        store: storeData,
      }

      setCurrentUser(userWithStore)
      setCurrentStore(storeData)
      setIsAuthenticated(true)

      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setCurrentUser(null)
    setCurrentStore(null)
    setIsAuthenticated(false)
    setCurrentShift(null)
    setSales([])
    setVisits([])
    setProducts([])
    setUsers([])
    setStores([])
  }

  const register = async (
    login: string,
    password: string,
    name: string,
    role: "store_manager" | "seller",
    storeId: string,
  ): Promise<boolean> => {
    if (!isOnline) return false

    try {
      const { data, error } = await supabase
        .from("users")
        .insert({
          login,
          password_hash: password,
          name,
          role,
          store_id: storeId,
        })
        .select("*")
        .single()

      if (error) {
        console.error("Registration error:", error)
        return false
      }

      // Обновляем список пользователей
      await loadData()
      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const addSale = async (saleData: Omit<Sale, "id" | "store_id" | "created_at">) => {
    if (!currentUser || !isOnline) return

    const storeId = currentUser.role === "super_admin" ? saleData.seller_id : currentUser.store_id
    if (!storeId) return

    try {
      const { data, error } = await supabase
        .from("sales")
        .insert({
          ...saleData,
          store_id: storeId,
          seller_id: currentUser.id,
        })
        .select("*")
        .single()

      if (error) throw error

      // Добавляем визит
      const visitNumber = visits.length + 1
      await supabase.from("visits").insert({
        store_id: storeId,
        seller_id: currentUser.id,
        title: `Візит ${visitNumber}`,
        sale_amount: saleData.total_amount,
      })

      // Перезагружаем данные
      await loadData()
      setTotalSalesAmount((prev) => prev + saleData.total_amount)
    } catch (error) {
      console.error("Error adding sale:", error)
    }
  }

  const addProduct = async (productData: Omit<Product, "id" | "store_id" | "created_at" | "updated_at">) => {
    if (!currentUser || !isOnline) return

    const storeId = currentUser.store_id
    if (!storeId) return

    try {
      await supabase.from("products").insert({
        ...productData,
        store_id: storeId,
      })

      await loadData()
    } catch (error) {
      console.error("Error adding product:", error)
      throw error
    }
  }

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    if (!isOnline) return

    try {
      await supabase
        .from("products")
        .update({ ...productData, updated_at: new Date().toISOString() })
        .eq("id", id)

      await loadData()
    } catch (error) {
      console.error("Error updating product:", error)
      throw error
    }
  }

  const deleteProduct = async (id: string) => {
    if (!isOnline) return

    try {
      await supabase.from("products").delete().eq("id", id)
      await loadData()
    } catch (error) {
      console.error("Error deleting product:", error)
      throw error
    }
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!currentUser || !isOnline) return false

    try {
      await supabase.from("users").delete().eq("id", userId)
      await loadData()
      return true
    } catch (error) {
      console.error("Error deleting user:", error)
      return false
    }
  }

  const startShift = async () => {
    if (!currentUser || !isOnline) return

    const storeId = currentUser.store_id
    if (!storeId) return

    try {
      const { data } = await supabase
        .from("shifts")
        .insert({
          store_id: storeId,
          user_id: currentUser.id,
          start_time: new Date().toISOString(),
          total_sales: 0,
        })
        .select("*")
        .single()

      if (data) {
        setCurrentShift(data)
        setTotalSalesAmount(0)
      }
    } catch (error) {
      console.error("Error starting shift:", error)
    }
  }

  const endShift = async () => {
    if (!currentShift || !isOnline) return

    try {
      await supabase.from("shifts").update({ end_time: new Date().toISOString() }).eq("id", currentShift.id)

      setCurrentShift(null)
      setWorkingHours(0)
      setWorkingMinutes(0)
    } catch (error) {
      console.error("Error ending shift:", error)
    }
  }

  const isShiftActive = currentShift !== null

  const getHourlyEarnings = () => {
    const totalHours = workingHours + workingMinutes / 60
    if (totalHours === 0) return 0
    return Math.round(totalSalesAmount / totalHours)
  }

  const getDailySalesStats = () => {
    // Простая реализация для демонстрации
    return []
  }

  const getTotalStats = () => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const totalSales = sales.length
    const averageSale = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0
    const cashAmount = sales
      .filter((s) => s.payment_method === "cash")
      .reduce((sum, sale) => sum + sale.total_amount, 0)
    const terminalAmount = sales
      .filter((s) => s.payment_method === "terminal")
      .reduce((sum, sale) => sum + sale.total_amount, 0)

    return {
      totalRevenue,
      totalSales,
      averageSale,
      topSellingDay: "",
      topSellingAmount: 0,
      cashAmount,
      terminalAmount,
    }
  }

  const value: AppContextType = {
    currentTime,
    sales,
    visits,
    products,
    users,
    stores,
    currentShift,
    totalSalesAmount,
    workingHours,
    workingMinutes,
    currentUser,
    currentStore,
    isAuthenticated,
    isOnline,
    addSale,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteUser,
    startShift,
    endShift,
    isShiftActive,
    getHourlyEarnings,
    login,
    logout,
    register,
    getDailySalesStats,
    getTotalStats,
    loadData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
