"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { hashPassword } from "@/lib/hash"

interface User {
  id: string
  store_id?: string
  login: string
  name: string
  role: "owner" | "seller"
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
    role: "owner" | "seller",
    storeId: string | null,
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

  useEffect(() => {
    const loadStores = async () => {
      if (!isOnline) return
      try {
        const { data: storesData, error } = await supabase.from("stores").select("*")
        if (error) {
          console.error("Error loading stores:", error)
          return
        }
        if (storesData) setStores(storesData)
      } catch (error) {
        console.error("Error loading stores:", error)
      }
    }
    loadStores()
  }, [isOnline])

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

  useEffect(() => {
    if (isAuthenticated && isOnline) {
      loadData()
    }
  }, [isAuthenticated, isOnline])

  const loadData = async () => {
    if (!isOnline) return
    try {
      const { data: storesData } = await supabase.from("stores").select("*")
      if (storesData) setStores(storesData)

      const { data: usersData } = await supabase.from("users").select("*")
      if (usersData) {
        const usersWithStores = usersData.map((user) => {
          const store = storesData?.find((s) => s.id === user.store_id)
          return { ...user, store }
        })
        setUsers(usersWithStores)
      }

      if (currentUser) {
        if (currentUser.role === "owner") {
          const { data: productsData } = await supabase.from("products").select("*")
          const { data: salesData } = await supabase.from("sales").select("*")
          const { data: visitsData } = await supabase.from("visits").select("*")

          if (productsData) setProducts(productsData)
          if (salesData) {
            const salesWithSellers = salesData.map((sale) => {
              const seller = usersData?.find((u) => u.id === sale.seller_id)
              return { ...sale, seller }
            })
            setSales(salesWithSellers)
          }
          if (visitsData) {
            const visitsWithSellers = visitsData.map((visit) => {
              const seller = usersData?.find((u) => u.id === visit.seller_id)
              return { ...visit, seller }
            })
            setVisits(visitsWithSellers)
          }
        } else if (currentUser.store_id) {
          const { data: productsData } = await supabase
            .from("products")
            .select("*")
            .eq("store_id", currentUser.store_id)
          const { data: salesData } = await supabase.from("sales").select("*").eq("store_id", currentUser.store_id)
          const { data: visitsData } = await supabase.from("visits").select("*").eq("store_id", currentUser.store_id)

          if (productsData) setProducts(productsData)
          if (salesData) {
            const salesWithSellers = salesData.map((sale) => {
              const seller = usersData?.find((u) => u.id === sale.seller_id)
              return { ...sale, seller }
            })
            setSales(salesWithSellers)
          }
          if (visitsData) {
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

  const hashedPassword = hashPassword(password)
  const cleanLogin = login.trim().toLowerCase()

  console.log("Login attempt:", cleanLogin, "Password hash:", hashedPassword)

  try {
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("login", cleanLogin)
      .maybeSingle()

    console.log("Supabase response:", { userData, error })

    if (error) {
      console.error("Ошибка при запросе пользователя:", error)
      return false
    }

    if (!userData) {
      console.error("Пользователь не найден с таким логином")
      return false
    }

    if (userData.password_hash !== hashedPassword) {
      console.error("Неверный пароль")
      return false
    }

    // Получаем магазин если есть
    let storeData = null
    if (userData.store_id) {
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("id", userData.store_id)
        .maybeSingle()

      if (storeError) {
        console.error("Ошибка при загрузке магазина пользователя:", storeError)
      } else {
        storeData = store
      }
    }

    const userWithStore = { ...userData, store: storeData }

    setCurrentUser(userWithStore)
    setCurrentStore(storeData)
    setIsAuthenticated(true)

    return true
  } catch (error) {
    console.error("Ошибка логина:", error)
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
  role: "owner" | "seller",
  storeId: string,
): Promise<boolean> => {
  if (!isOnline) return false

  const hashedPassword = hashPassword(password)
  const store_id_to_insert = typeof storeId === "string" && storeId.trim() !== "" ? storeId : null


  try {
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("login", login)
      .maybeSingle()

    if (existingUser) {
      console.error("User already exists")
      return false
    }

    const { error: insertError } = await supabase.from("users").insert({
      login,
      password_hash: hashedPassword,
      name,
      role: "seller", // жёстко "seller"
      store_id: store_id_to_insert,
    })

    if (insertError) {
      console.error("Insert user error:", insertError)
      return false
    }

    await loadData()
    return true
  } catch (error) {
    console.error("Registration error:", error)
    return false
  }
}


  // Остальные методы (addSale, addProduct, updateProduct, deleteProduct, deleteUser, startShift, endShift,
  // isShiftActive, getHourlyEarnings, getDailySalesStats, getTotalStats) оставляем без изменений
  // (Если хочешь — могу вставить их сюда тоже)

  // Для краткости дальше только value и return:

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
    addSale: async () => {},
    addProduct: async () => {},
    updateProduct: async () => {},
    deleteProduct: async () => {},
    deleteUser: async () => false,
    startShift: async () => {},
    endShift: async () => {},
    isShiftActive: currentShift !== null,
    getHourlyEarnings: () => 0,
    login,
    logout,
    register,
    getDailySalesStats: () => [],
    getTotalStats: () => ({}),
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
