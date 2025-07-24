"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
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
  getDailySalesStats: () => any[]
  getTotalStats: () => any
  loadData: (user: User | null) => Promise<void>
  getShiftStats: () => {
    start: Date
    end: Date
    totalAmount: number
    cashAmount: number
    terminalAmount: number
    count: number
    totalItems: number
    avgCheck: number
  } | null
  currentStoreId: string | null
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

  const currentStoreId = currentStore?.id || null

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
    if (isAuthenticated && isOnline && currentUser) {
      loadData(currentUser)
    }
  }, [isAuthenticated, isOnline])

  // ✅ ИСПРАВЛЕННАЯ функция loadData
  const loadData = async (user: User | null) => {
    if (!isOnline) return

    try {
      console.log("🔄 Loading data for user:", user?.name, "role:", user?.role)

      // Загружаем базовые данные
      const { data: storesData } = await supabase.from("stores").select("*")
      if (storesData) setStores(storesData)

      const { data: usersData } = await supabase.from("users").select("*")
      if (usersData) {
        const usersWithStores = usersData.map((userItem) => {
          const store = storesData?.find((s) => s.id === userItem.store_id)
          return { ...userItem, store }
        })
        setUsers(usersWithStores)
      }

      if (user) {
        await loadProducts(user)
      }

      // Функция для пересчета общей суммы продаж
      const recalcTotalSalesAmount = (salesList: Sale[]) => {
        const total = salesList.reduce((sum, sale) => sum + sale.total_amount, 0)
        setTotalSalesAmount(total)
      }

      if (user) {
        // Загружаем текущую смену
        const { data: shiftData } = await supabase
          .from("shifts")
          .select("*")
          .eq("user_id", user.id)
          .is("end_time", null)
          .maybeSingle()

        setCurrentShift(shiftData || null)

        // ✅ ИСПРАВЛЕНИЕ: Загружаем ВСЕ исторические данные независимо от смены
        if (user.role === "owner") {
          console.log("📊 Loading ALL data for owner")

          // Загружаем ВСЕ продажи для owner'а
          const { data: salesData } = await supabase.from("sales").select("*").order("created_at", { ascending: false })

          console.log("📈 All sales data loaded:", salesData?.length || 0, "sales")

          const { data: visitsData } = await supabase
            .from("visits")
            .select("*")
            .order("created_at", { ascending: false })

          if (salesData) {
            const salesWithSellers = salesData.map((sale) => {
              const seller = usersData?.find((u) => u.id === sale.seller_id)
              return { ...sale, seller }
            })
            setSales(salesWithSellers)
            recalcTotalSalesAmount(salesWithSellers)
            console.log(
              "✅ Sales set:",
              salesWithSellers.length,
              "total amount:",
              salesWithSellers.reduce((sum, s) => sum + s.total_amount, 0),
            )
          }

          if (visitsData) {
            const visitsWithSellers = visitsData.map((visit) => {
              const seller = usersData?.find((u) => u.id === visit.seller_id)
              return { ...visit, seller }
            })
            setVisits(visitsWithSellers)
          }
        } else if (user.store_id) {
          console.log("🏪 Loading store data for seller, store_id:", user.store_id)

          // Загружаем ВСЕ продажи магазина для seller'а
          const { data: salesData } = await supabase
            .from("sales")
            .select("*")
            .eq("store_id", user.store_id)
            .order("created_at", { ascending: false })

          const { data: visitsData } = await supabase
            .from("visits")
            .select("*")
            .eq("store_id", user.store_id)
            .order("created_at", { ascending: false })

          if (salesData) {
            const salesWithSellers = salesData.map((sale) => {
              const seller = usersData?.find((u) => u.id === sale.seller_id)
              return { ...sale, seller }
            })
            setSales(salesWithSellers)
            recalcTotalSalesAmount(salesWithSellers)
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
      console.error("❌ Error loading data:", error)
    }
  }

  const loadProducts = async (user: User) => {
    if (!isOnline || !user) return
    try {
      let data, error
      if (user.role === "owner") {
        const res = await supabase.from("products").select("*")
        data = res.data
        error = res.error
      } else if (user.store_id) {
        const res = await supabase.from("products").select("*").eq("store_id", user.store_id)
        data = res.data
        error = res.error
      }
      if (error) throw error
      if (data) setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  const login = async (login: string, password: string, selectedStoreId: string): Promise<boolean> => {
    if (!isOnline) return false
    const hashedPassword = hashPassword(password)
    const cleanLogin = login.trim().toLowerCase()
    try {
      const { data: userData, error } = await supabase.from("users").select("*").eq("login", cleanLogin).maybeSingle()
      if (error || !userData) {
        console.error("Login error or user not found:", error)
        return false
      }
      if (userData.password_hash !== hashedPassword) {
        console.error("Invalid password")
        return false
      }
      let storeData: Store | null = null
      if (selectedStoreId) {
        const { data: store, error: storeError } = await supabase
          .from("stores")
          .select("*")
          .eq("id", selectedStoreId)
          .maybeSingle()
        if (storeError) {
          console.error("Error loading selected store:", storeError)
          return false
        }
        storeData = store
      }
      const userWithStore: User = {
        ...userData,
        store: storeData || undefined,
      }
      setCurrentUser(userWithStore)
      setCurrentStore(storeData)
      setIsAuthenticated(true)
      await loadData(userWithStore)
      return true
    } catch (error) {
      console.error("Login failed:", error)
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
    storeId: string | null,
  ): Promise<boolean> => {
    if (!isOnline) return false
    const hashedPassword = hashPassword(password)
    const store_id_to_insert = typeof storeId === "string" && storeId.trim() !== "" ? storeId : null
    try {
      const { data: existingUser } = await supabase.from("users").select("id").eq("login", login).maybeSingle()
      if (existingUser) {
        console.error("User already exists")
        return false
      }
      const { error: insertError } = await supabase.from("users").insert({
        login,
        password_hash: hashedPassword,
        name,
        role: "seller",
        store_id: store_id_to_insert,
      })
      if (insertError) {
        console.error("Insert user error:", insertError)
        return false
      }
      await loadData(currentUser)
      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const startShift = async () => {
    if (!isOnline || !currentUser || currentShift) return
    try {
      await supabase.from("visits").delete().eq("store_id", currentStore?.id)
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          store_id: currentStore?.id || null,
          user_id: currentUser.id,
          start_time: now,
          total_sales: 0,
        })
        .select()
        .maybeSingle()
      if (error) {
        console.error("Error starting shift:", error)
        return
      }
      setCurrentShift(data || null)
    } catch (err) {
      console.error("Failed to start shift:", err)
    }
  }

  const endShift = async () => {
    if (!isOnline || !currentShift) return
    try {
      const now = new Date().toISOString()
      const { error } = await supabase.from("shifts").update({ end_time: now }).eq("id", currentShift.id)
      if (error) {
        console.error("Error ending shift:", error)
        return
      }
      await supabase.from("visits").delete().eq("store_id", currentStore?.id)
      setCurrentShift({ ...currentShift, end_time: now })
      setTotalSalesAmount(0)
    } catch (err) {
      console.error("Failed to end shift:", err)
    }
  }

  const addProduct = async (
    product: Omit<Product, "id" | "created_at" | "updated_at"> & { store_id: string | null },
  ): Promise<void> => {
    if (!isOnline || !currentUser) return
    try {
      const { store_id, ...rest } = product
      const actualStoreId = store_id || currentUser.store_id || null
      if (!actualStoreId) {
        console.error("store_id is required to add a product")
        return
      }
      console.log("Adding product with:", { ...rest, store_id: actualStoreId })
      const { data, error } = await supabase
        .from("products")
        .insert([{ ...rest, store_id: actualStoreId }])
        .select()
        .maybeSingle()
      if (error) {
        console.error("Error adding product:", error)
        return
      }
      if (data) {
        setProducts((prev) => [...prev, data])
      }
    } catch (error) {
      console.error("addProduct failed:", error)
    }
  }

  const updateProduct = async (id: string, product: Partial<Product>): Promise<void> => {
    if (!isOnline) return
    const cleanProductEntries = Object.entries(product).filter(([key, value]) => {
      if (value === undefined) return false
      if (key.endsWith("_id") && (value === "" || value === null)) return false
      if (value === "") return false
      return true
    })
    const cleanProduct = Object.fromEntries(cleanProductEntries)
    if (!id || Object.keys(cleanProduct).length === 0) {
      console.warn("updateProduct skipped: invalid id or empty product")
      return
    }
    try {
      const { data, error } = await supabase.from("products").update(cleanProduct).eq("id", id).select().maybeSingle()
      if (error) {
        console.error("Error updating product (full error):", JSON.stringify(error, null, 2))
        return
      }
      if (data) {
        setProducts((prev) => prev.map((p) => (p.id === id ? data : p)))
      }
    } catch (error) {
      console.error("updateProduct failed:", error)
    }
  }

  const deleteProduct = async (id: string): Promise<void> => {
    if (!isOnline) return
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) {
        console.error("Error deleting product:", error)
        return
      }
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error("deleteProduct failed:", error)
    }
  }

  const addSale = async (sale: Omit<Sale, "id" | "store_id" | "created_at">) => {
    if (!isOnline || !currentUser) {
      console.error("Offline or no user, cannot add sale")
      return
    }
    try {
      const store_id = currentStore?.id || null
      const { count: visitsCount, error: countError } = await supabase
        .from("visits")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store_id)
      if (countError) {
        console.error("Error counting visits:", countError)
      }
      const visitNumber = (visitsCount ?? 0) + 1
      const { data, error } = await supabase
        .from("sales")
        .insert([
          {
            store_id,
            seller_id: currentUser.id,
            receipt_number: sale.receipt_number,
            total_amount: sale.total_amount,
            payment_method: sale.payment_method,
            items_data: sale.items_data,
          },
        ])
        .select()
        .maybeSingle()
      if (error) {
        console.error("Error adding sale:", error)
        return
      }
      if (data) {
        setSales((prev) => {
          const updatedSales = [...prev, { ...data, seller: currentUser }]
          const total = updatedSales.reduce((sum, s) => sum + s.total_amount, 0)
          setTotalSalesAmount(total)
          return updatedSales
        })
        for (const item of sale.items_data) {
          const productId = item.product_id
          const soldQty = item.quantity
          if (!productId || !soldQty) continue
          const existingProduct = products.find((p) => p.id === productId)
          if (!existingProduct) continue
          const newQty = Math.max(0, existingProduct.quantity - soldQty)
          const { data: updatedProduct, error: updateError } = await supabase
            .from("products")
            .update({ quantity: newQty })
            .eq("id", productId)
            .select()
            .maybeSingle()
          if (updateError) {
            console.error(`Не вдалося оновити кількість товару ID ${productId}:`, updateError)
          }
          setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, quantity: newQty } : p)))
        }
      }
      if (visitNumber) {
        const { error: visitInsertError } = await supabase.from("visits").insert([
          {
            store_id,
            seller_id: currentUser.id,
            title: `Візит №${visitNumber}`,
            sale_amount: sale.total_amount,
          },
        ])
        if (visitInsertError) {
          console.error("Error adding visit:", visitInsertError)
        } else {
          setVisits((prev) => [
            ...prev,
            {
              id: `visit-${Date.now()}`,
              store_id: store_id || "",
              seller_id: currentUser.id,
              title: `Візит №${visitNumber}`,
              sale_amount: sale.total_amount,
              created_at: new Date().toISOString(),
              seller: currentUser,
            },
          ])
        }
      }
    } catch (error) {
      console.error("addSale failed:", error)
    }
  }

  // ✅ УЛУЧШЕННЫЕ функции для админки с логированием
  const getDailySalesStats = () => {
    console.log("📊 getDailySalesStats called, sales count:", sales.length)

    if (!sales || sales.length === 0) {
      console.log("❌ No sales data available")
      return []
    }

    const statsMap: Record<
      string,
      {
        salesCount: number
        totalAmount: number
        sellers: { [sellerId: string]: { name: string; amount: number; salesCount: number } }
      }
    > = {}

    sales.forEach((sale) => {
      // ✅ ИСПРАВЛЕНИЕ: Правильное форматирование даты
      const date = new Date(sale.created_at).toISOString().split("T")[0] // Получаем YYYY-MM-DD
      if (!statsMap[date]) {
        statsMap[date] = { salesCount: 0, totalAmount: 0, sellers: {} }
      }
      statsMap[date].salesCount += 1
      statsMap[date].totalAmount += sale.total_amount

      if (sale.seller) {
        const sellerId = sale.seller.id
        if (!statsMap[date].sellers[sellerId]) {
          statsMap[date].sellers[sellerId] = {
            name: sale.seller.name,
            amount: 0,
            salesCount: 0,
          }
        }
        statsMap[date].sellers[sellerId].amount += sale.total_amount
        statsMap[date].sellers[sellerId].salesCount += 1
      }
    })

    const result = Object.entries(statsMap)
      .map(([date, stats]) => ({
        date,
        salesCount: stats.salesCount,
        totalAmount: stats.totalAmount,
        sellers: stats.sellers,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Сортируем по дате (новые сверху)

    console.log("✅ Daily stats result:", result)
    return result
  }

  const getTotalStats = () => {
    console.log("📈 getTotalStats called, sales count:", sales.length)

    if (!sales || sales.length === 0) {
      console.log("❌ No sales data for total stats")
      return {
        totalRevenue: 0,
        totalSales: 0,
        averageSale: 0,
        topSellingAmount: 0,
        topSellingDay: "",
        cashAmount: 0,
        terminalAmount: 0,
      }
    }

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const totalSales = sales.length
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0

    // Найти самый прибыльный день
    const dateStats: Record<string, number> = {}
    sales.forEach((sale) => {
      const date = new Date(sale.created_at).toISOString().split("T")[0]
      dateStats[date] = (dateStats[date] || 0) + sale.total_amount
    })

    let topSellingAmount = 0
    let topSellingDay = ""
    Object.entries(dateStats).forEach(([date, amount]) => {
      if (amount > topSellingAmount) {
        topSellingAmount = amount
        topSellingDay = date
      }
    })

    // Суммы по типу оплаты
    const cashAmount = sales.filter((s) => s.payment_method === "cash").reduce((sum, s) => sum + s.total_amount, 0)
    const terminalAmount = sales
      .filter((s) => s.payment_method === "terminal")
      .reduce((sum, s) => sum + s.total_amount, 0)

    const result = {
      totalRevenue,
      totalSales,
      averageSale,
      topSellingAmount,
      topSellingDay,
      cashAmount,
      terminalAmount,
    }

    console.log("✅ Total stats result:", result)
    return result
  }

  const getShiftStats = () => {
    if (!currentShift) return null
    const start = new Date(currentShift.start_time)
    const end = currentShift.end_time ? new Date(currentShift.end_time) : new Date()
    const salesDuringShift = sales.filter((s) => {
      const created = new Date(s.created_at)
      return created >= start && created <= end
    })
    const totalAmount = salesDuringShift.reduce((sum, s) => sum + s.total_amount, 0)
    const cashAmount = salesDuringShift
      .filter((s) => s.payment_method === "cash")
      .reduce((sum, s) => sum + s.total_amount, 0)
    const terminalAmount = salesDuringShift
      .filter((s) => s.payment_method === "terminal")
      .reduce((sum, s) => sum + s.total_amount, 0)
    const count = salesDuringShift.length
    const totalItems = salesDuringShift.reduce((sum, s) => sum + s.items_data.length, 0)
    const avgCheck = count > 0 ? totalAmount / count : 0
    return { start, end, totalAmount, cashAmount, terminalAmount, count, totalItems, avgCheck }
  }

  const isShiftActive = Boolean(currentShift && !currentShift.end_time)

  const getHourlyEarnings = () => {
    if (!currentShift) return 0
    const totalMinutes = workingHours * 60 + workingMinutes
    if (totalMinutes === 0) return 0
    return totalSalesAmount / (totalMinutes / 60)
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!isOnline) return false
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId)
      if (error) {
        console.error("Error deleting user:", error)
        return false
      }
      await loadData(currentUser)
      return true
    } catch (error) {
      console.error("deleteUser failed:", error)
      return false
    }
  }

  return (
    <AppContext.Provider
      value={{
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
        currentStoreId,
        isAuthenticated,
        isOnline,
        addSale,
        addProduct,
        updateProduct,
        deleteProduct,
        startShift,
        endShift,
        isShiftActive,
        getHourlyEarnings,
        login,
        logout,
        register,
        deleteUser,
        getDailySalesStats,
        getTotalStats,
        getShiftStats,
        loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
