"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Package,
  MapPin,
  Filter,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useApp } from "../context/app-context";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 20;

interface Store {
  id: string;
  name: string;
}

// ---------------- Product Card ----------------
interface ProductCardProps {
  product: Product;
  store?: Store;
}

function ProductCard({ product, store }: ProductCardProps) {
  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { status: "out", label: "Немає в наявності", color: "bg-red-500" };
    if (quantity <= 10)
      return { status: "low", label: "Мало на складі", color: "bg-yellow-500" };
    return { status: "good", label: "В наявності", color: "bg-green-500" };
  };

  const stockStatus = getStockStatus(product.quantity);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-3">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
          <div
            className={`w-3 h-3 rounded-full ${stockStatus.color}`}
            title={stockStatus.label}
          />
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium">{product.brand}</span> {product.model}
          </p>
          {product.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {product.description}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-green-600">
              {product.price.toLocaleString()} ₴
            </span>
            <span
              className={`text-sm font-medium ${
                stockStatus.status === "out" ? "text-red-600" : ""
              }`}
            >
              {product.quantity} шт
            </span>
          </div>

          {product.barcode && (
            <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
              Штрих-код: {product.barcode}
            </div>
          )}

          {store && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{store.name}</span>
            </div>
          )}

          {product.created_at && (
            <div className="text-xs text-muted-foreground">
              Додано: {new Date(product.created_at).toLocaleDateString("uk-UA")}
            </div>
          )}
        </div>

        {product.quantity === 0 && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>Товар закінчився</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------- Main Component ----------------
interface FindProductPageProps {
  onBack: () => void;
}

const FindProductPage = ({ onBack }: FindProductPageProps) => {
  const { stores, currentUser, currentStore } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState(currentStore?.id || "all");
  const [stockFilter, setStockFilter] = useState("in-stock");
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const isFetching = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("products")
        .select("category")
        .order("category");

      if (data) {
        const uniqueCategories = Array.from(
          new Set(data.map((p) => p.category))
        ).filter(Boolean);
        setCategories(uniqueCategories as string[]);
      }
    };
    fetchCategories();
  }, []);

  // Загрузка товаров из БД с пагинацией
  const fetchProducts = useCallback(
    async (reset = false) => {
      if (isFetching.current || (!hasMore && !reset)) return;
      isFetching.current = true;
      setIsLoading(true);

      const nextPage = reset ? 0 : page;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .order("name", { ascending: true });

      // Фильтр по магазину
      if (storeFilter !== "all") {
        query = query.eq("store_id", storeFilter);
      } else if (currentStore) {
        query = query.eq("store_id", currentStore.id);
      }

      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch) {
        query = query.or(
          `name.ilike.%${trimmedSearch}%,brand.ilike.%${trimmedSearch}%,model.ilike.%${trimmedSearch}%,barcode.ilike.%${trimmedSearch}%`
        );
      }

      // Фильтр по категории
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      // Фильтр по наличию
      if (stockFilter === "in-stock") {
        query = query.gt("quantity", 0);
      } else if (stockFilter === "out-of-stock") {
        query = query.eq("quantity", 0);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error("Error fetching products:", error);
        isFetching.current = false;
        setIsLoading(false);
        return;
      }

      if (reset) {
        setProducts(data || []);
        setPage(1);
        setHasMore((data?.length || 0) === PAGE_SIZE);
        setTotalCount(count || 0);
      } else {
        setProducts((prev) => [...prev, ...(data || [])]);
        setPage((prev) => prev + 1);
        setHasMore((data?.length || 0) === PAGE_SIZE);
      }

      isFetching.current = false;
      setIsLoading(false);
    },
    [
      page,
      searchTerm,
      categoryFilter,
      storeFilter,
      stockFilter,
      currentStore,
      hasMore,
    ]
  );

  // Сброс и загрузка при изменении фильтров
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setProducts([]);
    const timer = setTimeout(() => {
      fetchProducts(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, categoryFilter, storeFilter, stockFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStoreFilter(currentStore?.id || "all");
    setStockFilter("in-stock");
    searchInputRef.current?.focus();
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchProducts(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-foreground text-background px-6 py-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-background hover:bg-muted-foreground/20"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Пошук товарів</h1>
        <Badge variant="secondary" className="bg-muted text-foreground">
          {totalCount} знайдено
        </Badge>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Search & Filters */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Пошук за назвою, брендом, моделлю або штрих-кодом..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              {/* CATEGORY */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Всі категорії" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі категорії</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* STORE FILTER */}
              {currentUser?.role === "owner" && stores.length > 0 && (
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Всі магазини" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі магазини</SelectItem>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* STOCK FILTER */}
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Наявність" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі товари</SelectItem>
                  <SelectItem value="in-stock">В наявності</SelectItem>
                  <SelectItem value="out-of-stock">
                    Немає в наявності
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={resetFilters}>
                <Filter className="h-4 w-4 mr-2" /> Скинути
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading && products.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-muted-foreground mb-2">
              Товари не знайдено
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Спробуйте змінити критерії пошуку"
                : "Введіть назву товару або відскануйте штрих-код"}
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const store = stores.find((s) => s.id === product.store_id);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    store={store}
                  />
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center mt-6">
                <Button onClick={loadMore} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Завантаження...
                    </>
                  ) : (
                    `Завантажити ще (показано ${products.length} з ${totalCount})`
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FindProductPage;
