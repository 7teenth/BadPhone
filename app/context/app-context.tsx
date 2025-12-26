"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { hashPassword } from "@/lib/hash";

interface User {
  id: string;
  store_id?: string;
  login: string;
  name: string;
  role: "owner" | "seller";
  created_at: string;
  updated_at: string;
  store?: Store;
}

interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  store_id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description?: string;
  brand: string;
  model: string;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

interface Sale {
  id: string;
  store_id: string;
  seller_id?: string;
  receipt_number: string;
  total_amount: number;
  payment_method: "cash" | "terminal";
  items_data: any[];
  created_at: string;
  seller?: User;
}

interface Visit {
  id: string;
  sale_id: string;
  store_id: string;
  seller_id?: string;
  title: string;
  sale_amount: number;
  payment_method?: "cash" | "terminal" | null;
  created_at: string;
  seller?: User;
}

interface Shift {
  id: string;
  store_id?: string;
  user_id: string;
  start_time: string;
  end_time?: string | null;
  is_active?: boolean;
  total_sales: number;
  created_at: string;
  user?: User;
}

interface AppState {
  currentTime: string;
  sales: Sale[];
  visits: Visit[];
  products: Product[];
  categories: Category[];
  users: User[];
  stores: Store[];
  currentShift: Shift | null;
  totalSalesAmount: number;
  workingHours: number;
  workingMinutes: number;
  currentUser: User | null;
  currentStore: Store | null;
  isAuthenticated: boolean;
  isOnline: boolean;
}

interface AppContextType extends AppState {
  addSale: (
    sale: Omit<Sale, "id" | "store_id" | "created_at">
  ) => Promise<{ id: string; payment_method?: string }>; 
  addProduct: (
    product: Omit<Product, "id" | "created_at" | "updated_at"> & {
      store_id?: string | null;
    }
  ) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  startShift: () => Promise<void>;
  endShift: () => Promise<void>;
  isShiftActive: boolean;
  getHourlyEarnings: () => number;
  login: (
    login: string,
    password: string,
    selectedStoreId: string
  ) => Promise<boolean>;
  logout: () => void;
  register: (
    login: string,
    password: string,
    name: string,
    role: "owner" | "seller",
    storeId: string | null
  ) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  createCategory: (name: string) => Promise<Category | null>;
  getDailySalesStats: () => any[];
  getTotalStats: () => any;
  loadData: (user: User | null) => Promise<void>;
  /**
   * Load products with optional pagination params. By default fetches first 50.
   * If append is true, new records are appended to current products.
   */
  loadProducts: (
    user: User,
    opts?: { limit?: number; offset?: number; append?: boolean }
  ) => Promise<void>;
  /** load more products using current state (append more starting from current length) */
  loadMoreProducts: (user: User) => Promise<void>;
  productsTotalCount?: number | null;
  productsLoading?: boolean;
  getShiftStats: () => {
    start: Date;
    end: Date;
    totalAmount: number;
    cashAmount: number;
    terminalAmount: number;
    count: number;
    totalItems: number;
    avgCheck: number;
  } | null;
  currentStoreId: string | null;
  refreshVisits?: () => Promise<void>;
  refreshSales: () => Promise<void>;
  removeVisit: (visitId: string) => void;
  storesLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsTotalCount, setProductsTotalCount] = useState<number | null>(
    null
  );
  const [productsLoading, setProductsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [workingHours, setWorkingHours] = useState(0);
  const [workingMinutes, setWorkingMinutes] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();
  // If a shift should be auto-closed at midnight but we were offline at that moment,
  // track a pending auto-close so we can finish it when we return online.
  const [pendingAutoClose, setPendingAutoClose] = useState(false);

  const currentStoreId = currentStore?.id || null;

  const removeVisit = (visitId: string) => {
    setVisits((prev) => {
      const filtered = prev.filter((visit) => visit.id !== visitId);
      return filtered;
    });
  };

  // Try to load stores from localStorage on init
  useEffect(() => {
    try {
      const cachedStores = localStorage.getItem("stores");
      if (cachedStores) {
        const parsed = JSON.parse(cachedStores);
        setStores(parsed);
        setStoresLoading(false);
      }
    } catch (err) {
      console.warn("Failed to load stores from cache:", err);
    }
  }, []);

  // Main stores loading effect
  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 5; // Increased retries

    const loadStores = async () => {
      try {
        setStoresLoading(true);
        const { data: storesData, error } = await supabase
          .from("stores")
          .select("*");

        if (error) {
          console.error("Error loading stores:", error);

          // More aggressive retry logic
          if (retryCount < maxRetries && !cancelled) {
            retryCount++;
            const delay = Math.min(1000 * Math.pow(1.5, retryCount), 10000); // Exponential backoff with 10s cap
            setTimeout(() => {
              if (!cancelled) {
                loadStores();
              }
            }, delay);
            return;
          }
        } else if (!cancelled && storesData) {
          setStores(storesData);
          // Cache stores in localStorage
          try {
            localStorage.setItem("stores", JSON.stringify(storesData));
          } catch (err) {
            console.warn("Failed to cache stores:", err);
          }
        }
      } catch (error) {
        console.error("Error loading stores:", error);

        // Retry on network errors
        if (retryCount < maxRetries && !cancelled) {
          retryCount++;
          setTimeout(() => {
            if (!cancelled) {
              loadStores();
            }
          }, 1000 * retryCount);
          return;
        }
      } finally {
        if (!cancelled) {
          setStoresLoading(false);
        }
      }
    };

    loadStores();

    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("uk-UA", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentShift) {
      setWorkingHours(0);
      setWorkingMinutes(0);
      return;
    }

    const updateWorkingTime = () => {
      const now = new Date();
      const startTime = new Date(currentShift.start_time);
      const diffMs = now.getTime() - startTime.getTime();
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setWorkingHours(hours);
      setWorkingMinutes(minutes);
    };

    updateWorkingTime();
    const interval = setInterval(updateWorkingTime, 60000);
    return () => clearInterval(interval);
  }, [currentShift]);

  // Auto-close active shifts at midnight (midnight relative to the shift start date).
  useEffect(() => {
    if (!currentShift) {
      setPendingAutoClose(false);
      return;
    }

    // compute the next midnight after the shift start
    try {
      const shiftStart = new Date(currentShift.start_time);
      const nextMidnight = new Date(
        shiftStart.getFullYear(),
        shiftStart.getMonth(),
        shiftStart.getDate() + 1,
        0,
        0,
        0,
        0
      );

      const now = new Date();

      // If we've already passed the scheduled midnight boundary, try to close immediately
      if (now >= nextMidnight) {
        if (isOnline) {
          // call endShift (makes a DB update)
          (async () => {
            try {
              await endShift();
              setPendingAutoClose(false);
            } catch (err) {
              console.warn("Auto-close failed (will retry when online):", err);
              setPendingAutoClose(true);
            }
          })();
        } else {
          // we missed the midnight while offline — mark pending so we handle when we're back online
          setPendingAutoClose(true);
        }

        return;
      }

      // Otherwise schedule a timer to trigger at that exact boundary
      const msUntil = nextMidnight.getTime() - now.getTime();
      const timer = setTimeout(async () => {
        try {
          if (isOnline) {
            await endShift();
            setPendingAutoClose(false);
          } else {
            setPendingAutoClose(true);
          }
        } catch (err) {
          console.error("Auto-close at midnight failed:", err);
          setPendingAutoClose(true);
        }
      }, msUntil);

      return () => clearTimeout(timer);
    } catch (err) {
      console.warn("Auto-close schedule failed:", err);
    }
  }, [currentShift, isOnline]);

  // If we were waiting to auto-close a shift (missed midnight while offline)
  // and we regained connectivity, end the shift now.
  useEffect(() => {
    if (!isOnline || !pendingAutoClose || !currentShift) return;

    (async () => {
      try {
        await endShift();
        setPendingAutoClose(false);
      } catch (err) {
        console.error(
          "Failed to auto-close shift after regaining online:",
          err
        );
      }
    })();
  }, [isOnline, pendingAutoClose, currentShift]);

  // Persist currentShift to localStorage so app can restore when offline / after crash
  useEffect(() => {
    try {
      if (currentShift) {
        localStorage.setItem("currentShift", JSON.stringify(currentShift));
      } else {
        localStorage.removeItem("currentShift");
      }
    } catch (err) {
      // ignore storage errors
    }
  }, [currentShift]);

  useEffect(() => {
    if (isAuthenticated && isOnline && currentUser) {
      loadData(currentUser);
    }
  }, [isAuthenticated, isOnline]);

  // Restore active shift for the logged in user/store (handles crash / app restart)
  useEffect(() => {
    const restoreShift = async () => {
      if (!currentUser || !currentStore) {
        // If offline and we have a locally cached shift, restore it
        if (!isOnline) {
          try {
            const saved = localStorage.getItem("currentShift");
            if (saved) {
              const parsed = JSON.parse(saved);
              setCurrentShift(parsed);
            }
          } catch (err) {
            console.warn("Failed to restore shift from localStorage:", err);
          }
        }
        return;
      }

      try {
        // First try to find an explicitly active shift
        const { data: activeShift, error } = await supabase
          .from("shifts")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("store_id", currentStore.id)
          .eq("is_active", true)
          .maybeSingle();

        if (activeShift) {
          setCurrentShift(activeShift);
          return;
        }

        // Fallback: older schema using end_time == null
        const { data: shiftData } = await supabase
          .from("shifts")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("store_id", currentStore.id)
          .is("end_time", null)
          .maybeSingle();

        if (shiftData) {
          setCurrentShift(shiftData);
        }
      } catch (err) {
        console.warn("restoreShift failed, will try local cache:", err);
        try {
          const saved = localStorage.getItem("currentShift");
          if (saved) setCurrentShift(JSON.parse(saved));
        } catch (e) {
          /* ignore */
        }
      }
    };

    restoreShift();
  }, [currentUser, currentStore, isOnline]);

  const loadData = async (user: User | null, store?: Store | null) => {
    if (!isOnline) return;

    try {
      const { data: storesData } = await supabase.from("stores").select("*");
      if (storesData) setStores(storesData);

      const { data: usersData } = await supabase.from("users").select("*");
      if (usersData) {
        const usersWithStores = usersData.map((userItem) => {
          const store = storesData?.find((s) => s.id === userItem.store_id);
          return { ...userItem, store };
        });
        setUsers(usersWithStores);
      }

      if (user) {
        await loadProducts(user);
        // Load persisted categories (try DB first, fall back to cache)
        try {
          const { data: categoryData, error: catError } = await supabase
            .from("categories")
            .select("*")
            .order("name", { ascending: true });
          if (!catError && categoryData) {
            setCategories(categoryData);
            try {
              localStorage.setItem("categories", JSON.stringify(categoryData));
            } catch (e) {}
          }
        } catch (e) {
          console.warn("Failed to load categories from DB, will try cache:", e);
          try {
            const cached = localStorage.getItem("categories");
            if (cached) setCategories(JSON.parse(cached));
          } catch (err) {}
        }
      }

      const recalcTotalSalesAmount = (salesList: Sale[]) => {
        const total = salesList.reduce(
          (sum, sale) => sum + sale.total_amount,
          0
        );
        setTotalSalesAmount(total);
      };

      const storeId = store?.id || currentStore?.id || user?.store_id;

      if (!user?.id) {
        console.warn("⚠️ loadData: user_id is missing, skipping shift check");
        return;
      }

      if (!storeId) {
        console.warn(
          "⚠️ loadData: store_id is missing, skipping store-dependent data"
        );
        return;
      }

      // 🔍 Проверяем активную смену
      const { data: shiftData, error: shiftError } = await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", user.id)
        .eq("store_id", storeId)
        .eq("is_active", true)
        .maybeSingle();

      if (shiftData) {
        setCurrentShift(shiftData);
      } else if (!shiftError) {
        const { data: unclosedShift } = await supabase
          .from("shifts")
          .select("*")
          .eq("user_id", user.id)
          .eq("store_id", storeId)
          .is("end_time", null)
          .maybeSingle();

        if (unclosedShift) {
          setCurrentShift(unclosedShift);
        } else {
          setCurrentShift(null);
        }
      } else {
        console.warn("❌ Error checking shifts:", shiftError);
      }

      // === OWNER ===
      if (user.role === "owner") {
        const { data: salesData } = await supabase
          .from("sales")
          .select("*")
          .order("created_at", { ascending: false });

        const { data: visitsData } = await supabase
          .from("visits")
          .select("*")
          .eq("store_id", storeId)
          .order("created_at", { ascending: false });

        if (salesData) {
          const salesWithSellers = salesData.map((sale) => {
            const seller = usersData?.find((u) => u.id === sale.seller_id);
            return { ...sale, seller };
          });
          setSales(salesWithSellers);
          recalcTotalSalesAmount(salesWithSellers);
        }

        if (visitsData) {
          const visitsWithSellers = visitsData.map((visit) => {
            const seller = usersData?.find((u) => u.id === visit.seller_id);
            return { ...visit, seller };
          });
          setVisits(visitsWithSellers);
        } else {
          setVisits([]);
        }
      }

      // === SELLER ===
      else if (user.role === "seller") {
        const today = new Date();
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ).toISOString();

        const { data: salesData } = await supabase
          .from("sales")
          .select("*")
          .eq("store_id", storeId)
          .eq("seller_id", user.id)
          .gte("created_at", startOfDay)
          .order("created_at", { ascending: false });

        const { data: visitsData } = await supabase
          .from("visits")
          .select("*")
          .eq("store_id", storeId)
          .eq("seller_id", user.id)
          .gte("created_at", startOfDay)
          .order("created_at", { ascending: false });

        if (salesData) {
          const salesWithSellers = salesData.map((sale) => {
            const seller = usersData?.find((u) => u.id === sale.seller_id);
            return { ...sale, seller };
          });
          setSales(salesWithSellers);
          recalcTotalSalesAmount(salesWithSellers);
        }

        if (visitsData) {
          const visitsWithSellers = visitsData.map((visit) => {
            const seller = usersData?.find((u) => u.id === visit.seller_id);
            return { ...visit, seller };
          });
          setVisits(visitsWithSellers);
        }
      }
    } catch (error) {
      console.error("❌ Error loading data:", error);
    }
  };

  const loadProducts = async (
    user: User,
    opts: { limit?: number; offset?: number; append?: boolean } = {}
  ) => {
    if (!isOnline || !user) return;

    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;
    const append = !!opts.append;

    setProductsLoading(true);
    if (!isOnline || !user) return;

    try {
      let res, data, error, count;

      if (user.role === "owner") {
        // range is inclusive
        res = await supabase
          .from("products")
          .select("*", { count: "exact" })
          .range(offset, offset + limit - 1);
      } else {
        const storeId = currentStore?.id || user.store_id;
        if (!storeId) {
          setProducts([]);
          setProductsTotalCount(0);
          setProductsLoading(false);
          return;
        }

        res = await supabase
          .from("products")
          .select("*", { count: "exact" })
          .eq("store_id", storeId)
          .range(offset, offset + limit - 1);
      }

      data = res.data;
      error = res.error;
      // @ts-ignore - supabase client returns 'count' on responses when requested
      count = res.count ?? null;

      if (error) throw error;

      if (Array.isArray(data)) {
        if (append && offset > 0) setProducts((prev) => [...prev, ...data]);
        else setProducts(data);
      }

      // set total count if available (used by UI to control load more)
      if (typeof count === "number") {
        setProductsTotalCount(count);
      } else if (Array.isArray(data)) {
        // fallback: if no count provided, estimate
        setProductsTotalCount((prev) => (prev == null ? data.length : prev));
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  const login = async (
    login: string,
    password: string,
    selectedStoreId: string
  ): Promise<boolean> => {
    if (!isOnline) return false;

    const hashedPassword = hashPassword(password);
    const cleanLogin = login.trim().toLowerCase();

    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("login", cleanLogin)
        .maybeSingle();

      if (error || !userData) {
        console.error("Login error or user not found:", error);
        return false;
      }

      if (userData.password_hash !== hashedPassword) {
        console.error("Invalid password");
        return false;
      }

      // 🔹 Проверка активных смен пользователя в других магазинах
      const { data: activeShifts, error: shiftError } = await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", userData.id)
        .eq("is_active", true);

      if (shiftError) {
        console.error("Error checking active shift:", shiftError);
        return false;
      }

      if (activeShifts && activeShifts.length > 0) {
        // Проверяем, есть ли активная смена в другом магазине
        const otherShift = activeShifts.find(
          (s) => s.store_id !== selectedStoreId
        );

        if (otherShift) {
          let storeName = "інший магазин";

          if (otherShift.store_id) {
            const { data: store } = await supabase
              .from("stores")
              .select("name")
              .eq("id", otherShift.store_id)
              .maybeSingle();

            if (store?.name) storeName = store.name;
          }

          alert(
            `🚫 У вас вже відкрита зміна в магазині "${storeName}". Спочатку закрийте її, щоб увійти в інший.`
          );
          return false;
        }
      }

      // 🔹 Дальше твоя логика загрузки магазина и данных
      let storeData: Store | null = null;
      if (selectedStoreId) {
        const { data: store, error: storeError } = await supabase
          .from("stores")
          .select("*")
          .eq("id", selectedStoreId)
          .maybeSingle();

        if (storeError) {
          console.error("Error loading selected store:", storeError);
          return false;
        }
        storeData = store;
      }

      const userWithStore: User = {
        ...userData,
        store: storeData || undefined,
      };

      setCurrentUser(userWithStore);
      setCurrentStore(storeData);
      setIsAuthenticated(true);

      await loadData(userWithStore, storeData);

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentStore(null);
    setIsAuthenticated(false);
    setCurrentShift(null);
    setSales([]);
    setVisits([]);
    setProducts([]);
    setUsers([]);
    setStores([]);
  };

  const register = async (
    login: string,
    password: string,
    name: string,
    role: "owner" | "seller",
    storeId: string | null
  ): Promise<boolean> => {
    if (!isOnline) return false;

    const hashedPassword = hashPassword(password);
    const store_id_to_insert =
      typeof storeId === "string" && storeId.trim() !== "" ? storeId : null;

    try {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("login", login)
        .maybeSingle();

      if (existingUser) {
        console.error("User already exists");
        return false;
      }

      const { error: insertError } = await supabase.from("users").insert({
        login,
        password_hash: hashedPassword,
        name,
        role: "seller",
        store_id: store_id_to_insert,
      });

      if (insertError) {
        console.error("Insert user error:", insertError);
        return false;
      }

      await loadData(currentUser);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const startShift = async () => {
    if (!currentUser) return;

    // If there's already a currentShift in memory, don't create a new one
    if (currentShift) return;

    try {
      // Remove existing visits for store (clean slate)
      if (currentStore?.id) {
        await supabase.from("visits").delete().eq("store_id", currentStore.id);
      }

      // Check DB for an existing active shift to avoid duplicates
      if (isOnline) {
        const { data: existing } = await supabase
          .from("shifts")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("is_active", true);

        if (existing && existing.length > 0) {
          setCurrentShift(existing[0]);
          setVisits([]);
          return;
        }
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          store_id: currentStore?.id || null,
          user_id: currentUser.id,
          start_time: now,
          total_sales: 0,
          is_active: true,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error("Error starting shift:", error);
        return;
      }

      setCurrentShift(data || null);
      setVisits([]);
      // Clear previously-entered product defaults at shift start so the Add Product
      // form starts empty for the first product in the new shift.
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem("lastProductDefaults");
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error("Failed to start shift:", err);
    }
  };

  const endShift = async () => {
    if (!currentShift) return;

    try {
      const now = new Date().toISOString();

      // Calculate total sales for this shift only (sales between shift.start_time and now)
      // and then persist that value in the shift row. This prevents saving a global
      // or cumulative amount which would make shift stats incorrect.
      let shiftTotal = 0;
      try {
        const shiftStart = currentShift.start_time;

        // Query the DB for sales that happened during this shift for the same store and user
        const { data: shiftSales, error: salesError } = await supabase
          .from("sales")
          .select("total_amount")
          .gte("created_at", shiftStart)
          .lte("created_at", now)
          .eq("store_id", currentShift.store_id)
          .eq("seller_id", currentShift.user_id);

        if (!salesError && Array.isArray(shiftSales)) {
          shiftTotal = shiftSales.reduce(
            (sum, row) => sum + (row.total_amount || 0),
            0
          );
        } else if (salesError) {
          console.warn(
            "Failed to calculate shift total from sales table:",
            salesError
          );
        }
      } catch (e) {
        console.warn("Error while computing shift total:", e);
      }
      // Update end_time and mark is_active = false with the shift-specific total
      const { error } = await supabase
        .from("shifts")
        .update({
          end_time: now,
          is_active: false,
          total_sales: shiftTotal,
        })
        .eq("id", currentShift.id);

      if (error) {
        console.error("Error ending shift:", error);
        return;
      }

      if (currentStore?.id) {
        await supabase.from("visits").delete().eq("store_id", currentStore.id);
      }

      // ✅ Properly clear the current shift to allow starting a new one
      setCurrentShift(null);
      setTotalSalesAmount(0);
      setVisits([]);
    } catch (err) {
      console.error("Failed to end shift:", err);
    }
  };

  const addProduct = async (
    product: Omit<Product, "id" | "created_at" | "updated_at"> & {
      store_id: string | null;
    }
  ): Promise<void> => {
    if (!isOnline || !currentUser) return;

    try {
      const { store_id, ...rest } = product;
      const actualStoreId =
        store_id || currentStore?.id || currentUser.store_id || null;

      if (!actualStoreId) {
        console.error("store_id is required to add a product");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .insert([{ ...rest, store_id: actualStoreId }])
        .select()
        .maybeSingle();

      if (error) {
        console.error("Error adding product:", error);
        return;
      }

      if (data) {
        setProducts((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error("addProduct failed:", error);
    }
  };

  const createCategory = async (name: string): Promise<Category | null> => {
    if (!isOnline) return null;
    const cleaned = name.trim();
    if (!cleaned) return null;

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{ name: cleaned }])
        .select()
        .maybeSingle();

      if (error) {
        // Try to recover: even if insert returned an error (for example due to
        // a unique constraint or other conflict), attempt to find the existing
        // category by name and return it when possible. This avoids confusing
        // the caller with an opaque empty error object.
        try {
          const { data: existing, error: existingErr } = await supabase
            .from("categories")
            .select("*")
            .eq("name", cleaned)
            .maybeSingle();

          if (!existingErr && existing) {
            setCategories((prev) => {
              const found = prev.find((p) => p.id === existing.id);
              if (found) return prev;
              return [...prev, existing];
            });
            // User feedback: inform the user we reused an existing category
            try {
              toast({
                title: "Категорія вже існує",
                description: `Використано існуючу категорію "${cleaned}"`,
                // keep default styling, short-lived
              });
            } catch (e) {
              console.warn("toast failed (non-fatal)", e);
            }
            return existing as Category;
          }
        } catch (e) {
          // ignore — we'll log the original error below
        }

        // Log a richer error object when available so the console isn't just `{}`.
        // Supabase error objects may be Error instances with non-enumerable
        // properties (JSON.stringify shows `{}`), so log multiple representations.
        // Diagnostics: log raw error client-side and attempt to post it to the server
        try {
          console.error("createCategory error (raw):", error);

          const summarizeError = (err: any) => {
            if (!err && err !== 0) return String(err);
            try {
              const parts: string[] = [];
              if (typeof err === "string") parts.push(err);
              if (err?.message) parts.push(`message=${err.message}`);
              if (err?.code) parts.push(`code=${err.code}`);
              if (err?.details) parts.push(`details=${err.details}`);
              if (err?.hint) parts.push(`hint=${err.hint}`);
              if (err?.status) parts.push(`status=${err.status}`);
              if (err?.statusCode) parts.push(`statusCode=${err.statusCode}`);
              if (typeof err?.toString === "function") {
                const t = err.toString();
                if (t && t !== "[object Object]") parts.push(`toString=${t}`);
              }

              const keys = Object.keys(err || {});
              if (keys.length > 0) {
                const small = keys.reduce(
                  (acc: any, k) => ({ ...acc, [k]: err[k] }),
                  {}
                );
                parts.push(`props=${JSON.stringify(small)}`);
              }

              if (parts.length > 0) return parts.join(" | ");
              const allProps = Object.getOwnPropertyNames(err || {}).reduce(
                (acc: any, k) => ({ ...acc, [k]: err[k] }),
                {}
              );
              if (Object.keys(allProps).length > 0)
                return `props_all=${JSON.stringify(allProps)}`;

              return String(err);
            } catch (e) {
              return String(err);
            }
          };

          try {
            console.error(
              "createCategory error summary:",
              summarizeError(error)
            );
            console.error("createCategory error (raw):", error);
          } catch (e) {
            console.error("createCategory error (fallback):", error);
          }

          // If the error object looks empty on the client (rare), POST to a server-side
          // diagnostics endpoint so we can capture server logs and more details.
          try {
            // Make a best-effort send (don't block): include context + user/store info if available
            const payload = {
              ctx: "createCategory",
              category_name: cleaned,
              client_user_id: currentUser?.id || null,
              client_store_id: currentStore?.id || null,
              client_agent: navigator?.userAgent || null,
              error_summary: summarizeError(error),
              error_raw: error,
              timestamp: new Date().toISOString(),
            } as any;

            // We intentionally don't await here for speed; fire & forget
            fetch("/api/diagnostics", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }).catch((e) => console.warn("Diagnostics POST failed:", e));
          } catch (e) {
            console.warn("Failed to send diagnostics payload:", e);
          }
        } catch (e) {
          console.error("createCategory error logging failed:", e);
        }

        return null;
      }

      if (data) {
        setCategories((prev) => [...prev, data]);
        try {
          localStorage.setItem(
            "categories",
            JSON.stringify([...categories, data])
          );
        } catch (e) {}

        try {
          toast({
            title: "Категорія створена",
            description: `Додано категорію "${cleaned}"`,
          });
        } catch (e) {
          // non-fatal if toast fails
        }
        return data as Category;
      }
    } catch (err) {
      console.error("createCategory failed:", err);
    }

    return null;
  };

  const updateProduct = async (
    id: string,
    product: Partial<Product>
  ): Promise<void> => {
    if (!isOnline) return;

    const cleanProductEntries = Object.entries(product).filter(
      ([key, value]) => {
        if (value === undefined) return false;
        if (key.endsWith("_id") && (value === "" || value === null))
          return false;
        if (value === "") return false;
        return true;
      }
    );

    const cleanProduct = Object.fromEntries(cleanProductEntries);

    if (!id || Object.keys(cleanProduct).length === 0) {
      console.warn("updateProduct skipped: invalid id or empty product");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .update(cleanProduct)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        console.error(
          "Error updating product (full error):",
          JSON.stringify(error, null, 2)
        );
        return;
      }

      if (data) {
        setProducts((prev) => prev.map((p) => (p.id === id ? data : p)));
      }
    } catch (error) {
      console.error("updateProduct failed:", error);
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    if (!isOnline) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) {
        console.error("Error deleting product:", error);
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("deleteProduct failed:", error);
    }
  };

  // ✅ ИСПРАВЛЕННАЯ функция addSale БЕЗ создания визитов
  const addSale = async (
    sale: Omit<Sale, "id" | "store_id" | "created_at">
  ): Promise<{ id: string; payment_method?: string }> => {
    if (!isOnline || !currentUser) {
      console.error("❌ Offline or no user, cannot add sale");
      throw new Error(
        "Немає підключення до інтернету або користувач не авторизований"
      );
    }

    try {
      const store_id = currentStore?.id || null;

      // Добавляем продажу
      const { data: saleData, error: saleError } = await supabase
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
        .single();

      if (saleError) {
        console.error("❌ Error adding sale:", saleError);
        throw new Error("Помилка створення продажу: " + saleError.message);
      }

      if (saleData) {
        // Обновляем список продаж и сумму
        setSales((prev) => {
          const updatedSales = [...prev, { ...saleData, seller: currentUser }];
          const total = updatedSales.reduce(
            (sum, s) => sum + s.total_amount,
            0
          );
          setTotalSalesAmount(total);
          return updatedSales;
        });

        // Обновляем товары параллельно для ускорения
        const productUpdates = sale.items_data.map(async (item) => {
          const productId = item.product_id;
          const soldQty = item.quantity;

          if (!productId || !soldQty) {
            console.warn(
              "⚠️ Missing product_id or quantity in sale item:",
              item
            );
            return;
          }

          const existingProduct = products.find((p) => p.id === productId);
          if (!existingProduct) {
            console.warn(`⚠️ Product ${productId} not found in local state`);
            return;
          }

          const currentQty = existingProduct.quantity;
          const newQty = Math.max(0, currentQty - soldQty);

          try {
            const { data: updatedProduct, error: updateError } = await supabase
              .from("products")
              .update({ quantity: newQty })
              .eq("id", productId)
              .select()
              .single();

            if (updateError) {
              console.error(
                `❌ Failed to update product ${productId} in Supabase:`,
                updateError
              );
              return;
            }

            if (updatedProduct) {
              setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProduct : p)));
            }
          } catch (err) {
            console.error(`❌ Failed to update product ${productId}:`, err);
          }
        });

        await Promise.all(productUpdates);
      }

      // ✅ Автоматически обновляем данные о продажах после создания новой продажи
      try {
        await refreshSales();
      } catch (refreshError) {
        console.warn("⚠️ Failed to auto-refresh sales data:", refreshError);
        // Не бросаем ошибку, так как продажа уже создана успешно
      }

      return { id: saleData.id, payment_method: saleData.payment_method };
    } catch (error) {
        console.error("❌ addSale failed:", error);
        throw error;
      }
    };
  const getDailySalesStats = () => {
    if (!sales || sales.length === 0) {
      return [];
    }

    const statsMap: Record<
      string,
      {
        salesCount: number;
        totalAmount: number;
        sellers: {
          [sellerId: string]: {
            name: string;
            amount: number;
            salesCount: number;
          };
        };
      }
    > = {};

    sales.forEach((sale) => {
      const date = new Date(sale.created_at).toISOString().split("T")[0];
      if (!statsMap[date]) {
        statsMap[date] = { salesCount: 0, totalAmount: 0, sellers: {} };
      }

      statsMap[date].salesCount += 1;
      statsMap[date].totalAmount += sale.total_amount;

      if (sale.seller) {
        const sellerId = sale.seller.id;
        if (!statsMap[date].sellers[sellerId]) {
          statsMap[date].sellers[sellerId] = {
            name: sale.seller.name,
            amount: 0,
            salesCount: 0,
          };
        }
        statsMap[date].sellers[sellerId].amount += sale.total_amount;
        statsMap[date].sellers[sellerId].salesCount += 1;
      }
    });

    const result = Object.entries(statsMap)
      .map(([date, stats]) => ({
        date,
        salesCount: stats.salesCount,
        totalAmount: stats.totalAmount,
        sellers: stats.sellers,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  };

  const getTotalStats = () => {
    if (!sales || sales.length === 0) {
      return {
        totalRevenue: 0,
        totalSales: 0,
        averageSale: 0,
        topSellingAmount: 0,
        topSellingDay: "",
        cashAmount: 0,
        terminalAmount: 0,
      };
    }

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + sale.total_amount,
      0
    );
    const totalSales = sales.length;
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    const dateStats: Record<string, number> = {};
    sales.forEach((sale) => {
      const date = new Date(sale.created_at).toISOString().split("T")[0];
      dateStats[date] = (dateStats[date] || 0) + sale.total_amount;
    });

    let topSellingAmount = 0;
    let topSellingDay = "";
    Object.entries(dateStats).forEach(([date, amount]) => {
      if (amount > topSellingAmount) {
        topSellingAmount = amount;
        topSellingDay = date;
      }
    });

    const cashAmount = sales
      .filter((s) => s.payment_method === "cash")
      .reduce((sum, s) => sum + s.total_amount, 0);
    const terminalAmount = sales
      .filter((s) => s.payment_method === "terminal")
      .reduce((sum, s) => sum + s.total_amount, 0);

    const result = {
      totalRevenue,
      totalSales,
      averageSale,
      topSellingAmount,
      topSellingDay,
      cashAmount,
      terminalAmount,
    };
    return result;
  };

  const getShiftStats = () => {
    if (!currentShift) {
      return null;
    }

    const start = new Date(currentShift.start_time);
    const end = currentShift.end_time
      ? new Date(currentShift.end_time)
      : new Date();

    const salesDuringShift = sales.filter((s) => {
      const created = new Date(s.created_at);
      const isInTimeRange = created >= start && created <= end;
      const isCurrentUser =
        currentUser?.role === "seller" ? s.seller_id === currentUser.id : true;
      const isCurrentStore = currentStore
        ? s.store_id === currentStore.id
        : true;

      return isInTimeRange && isCurrentUser && isCurrentStore;
    });

    const totalAmount = salesDuringShift.reduce(
      (sum, s) => sum + s.total_amount,
      0
    );
    const cashAmount = salesDuringShift
      .filter((s) => s.payment_method === "cash")
      .reduce((sum, s) => sum + s.total_amount, 0);
    const terminalAmount = salesDuringShift
      .filter((s) => s.payment_method === "terminal")
      .reduce((sum, s) => sum + s.total_amount, 0);

    const count = salesDuringShift.length;
    const totalItems = salesDuringShift.reduce(
      (sum, s) => sum + (s.items_data?.length || 0),
      0
    );
    const avgCheck = count > 0 ? totalAmount / count : 0;

    return {
      start,
      end,
      totalAmount,
      cashAmount,
      terminalAmount,
      count,
      totalItems,
      avgCheck,
    };
  };

  const refreshVisits = async () => {
    if (!currentUser) {
      setVisits([]);
      return;
    }

    const storeId = currentStore?.id;
    if (!storeId) {
      setVisits([]);
      return;
    }

    try {
      if (!storeId) {
        console.warn("⚠️ loadData: store_id is missing, skipping visits fetch");
        return;
      }

      const { data: visitsData } = await supabase
        .from("visits")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (visitsData) {
        const visitsWithSellers = visitsData.map((visit) => {
          const seller = users.find((u) => u.id === visit.seller_id);
          return { ...visit, seller };
        });
        setVisits(visitsWithSellers);
      } else {
        setVisits([]);
      }
    } catch (error) {
      console.error("❌ Error refreshing visits:", error);
      setVisits([]);
    }
  };

  const refreshSales = async () => {
    if (!isOnline || !currentUser) return;

    try {
      if (currentUser.role === "owner") {
        const { data: salesData } = await supabase
          .from("sales")
          .select("*")
          .order("created_at", { ascending: false });

        if (salesData) {
          const salesWithSellers = salesData.map((sale) => {
            const seller = users.find((u) => u.id === sale.seller_id);
            return { ...sale, seller };
          });
          setSales(salesWithSellers);

          // Пересчитываем общую сумму продаж
          const total = salesWithSellers.reduce(
            (sum, sale) => sum + sale.total_amount,
            0
          );
          setTotalSalesAmount(total);
        }
      } else if (currentUser.store_id || currentStore?.id) {
        const storeId = currentStore?.id || currentUser.store_id;
        const today = new Date();
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ).toISOString();

        if (storeId) {
          const { data: salesData } = await supabase
            .from("sales")
            .select("*")
            .eq("store_id", storeId)
            .eq("seller_id", currentUser.id)
            .gte("created_at", startOfDay)
            .order("created_at", { ascending: false });

          if (salesData) {
            const salesWithSellers = salesData.map((sale) => {
              const seller = users.find((u) => u.id === sale.seller_id);
              return { ...sale, seller };
            });
            setSales(salesWithSellers);

            // Пересчитываем общую сумму продаж
            const total = salesWithSellers.reduce(
              (sum, sale) => sum + sale.total_amount,
              0
            );
            setTotalSalesAmount(total);
          }
        } else {
          setSales([]);
          setTotalSalesAmount(0);
        }
      }
    } catch (error) {
      console.error("❌ Error refreshing sales:", error);
    }
  };

  const isShiftActive = Boolean(currentShift && !currentShift.end_time);

  const getHourlyEarnings = () => {
    if (!currentShift) return 0;
    const totalMinutes = workingHours * 60 + workingMinutes;
    if (totalMinutes === 0) return 0;
    return totalSalesAmount / (totalMinutes / 60);
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!isOnline) return false;

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        console.error("Error deleting user:", error);
        return false;
      }

      await loadData(currentUser);
      return true;
    } catch (error) {
      console.error("deleteUser failed:", error);
      return false;
    }
  };

  const loadMoreProducts = async (user: User) => {
    if (!user) return;
    try {
      await loadProducts(user, { offset: products.length, append: true });
    } catch (err) {
      console.error("loadMoreProducts failed:", err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentTime,
        sales,
        visits,
        products,
        categories,
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
        loadProducts,
        loadMoreProducts,
        productsTotalCount,
        productsLoading,
        refreshVisits,
        createCategory,
        refreshSales,
        removeVisit,
        storesLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
