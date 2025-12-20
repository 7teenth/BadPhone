"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useCallback, useRef, useEffect } from "react";
import { useApp } from "../context/app-context";
import type { SaleItem, Product } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Package,
  Search,
  Calculator,
  Receipt,
  AlertCircle,
  Percent,
  X,
} from "lucide-react";
import { DiscountModal } from "./discount-modal";
import SaleReceipt from "@/app/components/sale-receipt";

// Импорт или твои кастомные компоненты Button, Badge, Card, Input, Select и т.д.

const PAGE_SIZE = 20; // количество товаров на одной странице

interface SellPageProps {
  visitId: string;
  onBack: () => void;
  onCreateSale: (
    visitId: string,
    saleData: {
      items_data: SaleItem[];
      total_amount: number;
      payment_method?: "cash" | "terminal";
    }
  ) => Promise<{ id: string }>;
  onCreateVisit?: () => Promise<string>;
}

export default function SellPage({
  visitId,
  onBack,
  onCreateSale,
  onCreateVisit,
}: SellPageProps) {
  const { isOnline, currentUser, currentStore } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "terminal">(
    "cash"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const isFetching = useRef(false);

  const searchRef = useRef<HTMLInputElement | null>(null);

  // Фильтр по категориям/брендам
  const categories = Array.from(
    new Set(products.map((p) => p.category))
  ).filter(Boolean);
  const brands = Array.from(new Set(products.map((p) => p.brand))).filter(
    Boolean
  );

  // ----------------------
  // Функция подгрузки товаров с Supabase
  // ----------------------
  const fetchProducts = useCallback(
    async (reset = false) => {
      if (isFetching.current || (!hasMore && !reset)) return;
      isFetching.current = true;

      const nextPage = reset ? 0 : page;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("products")
        .select("*")
        .order("quantity", { ascending: false });

      // фильтр по магазину
      if (currentStore) {
        query = query.eq("store_id", currentStore.id);
      }

      // ----------------------
      // поиск
      // ----------------------
      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch) {
        // Убрана логика isBarcode, т.к. она некорректно определяла штрихкоды
        query = query.or(
          `name.ilike.%${trimmedSearch}%,brand.ilike.%${trimmedSearch}%,model.ilike.%${trimmedSearch}%,barcode.ilike.%${trimmedSearch}%`
        );
      }

      // фильтры по категории и бренду
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      if (brandFilter !== "all") {
        query = query.eq("brand", brandFilter);
      }

      const { data, error } = await query.range(from, to);

      if (error) {
        console.error(error);
        isFetching.current = false;
        return;
      }

      if (reset) {
        setProducts(data);
        setPage(1);
        setHasMore(data.length === PAGE_SIZE);
      } else {
        setProducts((prev) => [...prev, ...data]);
        setPage((prev) => prev + 1);
        setHasMore(data.length === PAGE_SIZE);
      }

      isFetching.current = false;
    },
    [page, searchTerm, categoryFilter, brandFilter, currentStore, hasMore]
  );

  // ----------------------
  // Загрузка при монтировании и при фильтрах
  // ----------------------
  useEffect(() => {
    fetchProducts(true); // сброс и загрузка
  }, [searchTerm, categoryFilter, brandFilter, currentStore]);

  // ----------------------
  // Кнопки и функции работы с корзиной
  // ----------------------
  const addToCart = useCallback((product: Product) => {
    if (product.quantity <= 0) {
      alert("Товар закінчився на складі");
      return;
    }
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product_id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity > product.quantity) {
          alert(`Недостатньо товару на складі. Доступно: ${product.quantity}`);
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                total: newQuantity * item.price,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            brand: product.brand,
            model: product.model,
            price: product.price,
            quantity: 1,
            total: product.price * 1,
          },
        ];
      }
    });
  }, []);

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (product && newQuantity > product.quantity) {
      alert(`Недостатньо товару на складі. Доступно: ${product.quantity}`);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const getSubtotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getTotalAmount = () => getSubtotal() - discountAmount;
  const getTotalItems = () =>
    cart.reduce((sum, item) => sum + item.quantity, 0);

  // ----------------------
  // Продажа и чек
  // ----------------------
  const handleCompleteSale = async () => {
    if (cart.length === 0 || !isOnline || isProcessing) return;

    setIsProcessing(true);
    try {
      const totalAmount = getTotalAmount();
      const subtotalAmount = getSubtotal();

      const normalizedItems = cart.map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        const name =
          item.product_name ||
          product?.name ||
          `Товар ${item.product_id ?? ""}`;
        const brand = item.brand || product?.brand || "";
        const quantity = item.quantity ?? 1;
        const price = item.price ?? product?.price ?? 0;
        const model = item.model || product?.model || "";
        const total = item.total ?? price * quantity;
        return {
          id: item.product_id,
          name,
          brand,
          quantity,
          price,
          total,
          model,
        };
      });

      const result = await onCreateSale(visitId, {
        items_data: normalizedItems.map((it) => ({
          product_id: it.id,
          product_name: it.name,
          brand: it.brand,
          quantity: it.quantity,
          price: it.price,
          total: it.total,
          model: it.model,
        })),
        total_amount: totalAmount,
        payment_method: paymentMethod,
      });

      const paymentMethodsMap: Record<"cash" | "terminal", string> = {
        cash: "Готівка",
        terminal: "Термінал",
      };

      const receiptData = {
        id: result.id,
        receiptNumber: `RCPT-${Date.now()}`,
        created_at: new Date().toISOString(),
        items: normalizedItems,
        total: totalAmount,
        subtotal: subtotalAmount,
        paymentMethod: paymentMethodsMap[paymentMethod],
        payment_cash: paymentMethod === "cash" ? totalAmount : 0,
        payment_card: paymentMethod === "terminal" ? totalAmount : 0,
      };

      setLastSaleData(receiptData);
      setShowReceipt(true);
      setCart([]);
      setDiscountAmount(0);
      setDiscountPercent(0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------
  // Подгрузка следующей страницы
  // ----------------------
  const loadMore = () => {
    if (!hasMore) return;
    fetchProducts();
  };

  // ----------------------
  // Если показываем чек
  // ----------------------
  if (showReceipt && lastSaleData) {
    return (
      <SaleReceipt
        sale={lastSaleData}
        onNewSale={() => {
          setShowReceipt(false);
          setLastSaleData(null);
          setCart([]);
          setDiscountAmount(0);
          setPaymentMethod("cash");
          fetchProducts(true); // обновление товаров
        }}
        onBack={() => {
          setShowReceipt(false);
          setLastSaleData(null);
          onBack();
        }}
      />
    );
  }

  // ----------------------
  // UI компонента
  // ----------------------
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Продаж</h1>
          <Badge variant="secondary" className="bg-gray-700 text-white text-xs">
            Візит ID: {visitId}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="bg-green-600 text-white border-green-600"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            {getTotalItems()} товарів
          </Badge>
          <div className="text-lg font-bold">
            {getTotalAmount().toLocaleString()} ₴
          </div>
        </div>
      </header>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3 flex-col sm:flex-row">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="sell-search-input"
                    type="search"
                    placeholder="Пошук товарів або скануйте штрих-код..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  Товари не знайдено
                </h3>
                <p className="text-gray-500">
                  Спробуйте змінити критерії пошуку
                </p>
              </div>
            ) : (
              products.map((product) => (
                <Card
                  key={product.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    product.quantity <= 0 ? "opacity-50" : "hover:scale-[1.02]"
                  }`}
                  onClick={() => product.quantity > 0 && addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium text-sm line-clamp-2 flex-1">
                          {product.name}
                        </h3>
                        <Badge
                          variant={
                            product.quantity > 10
                              ? "default"
                              : product.quantity > 0
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs shrink-0"
                        >
                          {product.quantity} шт
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        {product.brand} {product.model}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-600">
                          {product.price.toLocaleString()} ₴
                        </span>
                        {product.quantity <= 0 && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Немає
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="text-center mt-4">
              <Button onClick={loadMore}>Показати ще</Button>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" />
                Кошик ({getTotalItems()})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 max-h-80 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Кошик порожній</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight mb-1">
                          {item.product_name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-1">
                          {item.brand} {item.model}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          {item.price.toLocaleString()} ₴
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                        <button
                          onClick={() =>
                            updateCartItemQuantity(
                              item.product_id,
                              item.quantity - 1
                            )
                          }
                          className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartItemQuantity(
                              item.product_id,
                              item.quantity + 1
                            )
                          }
                          className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="h-3 w-3 text-gray-600" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="h-8 w-8 flex items-center justify-center rounded-md bg-red-600 hover:bg-red-700 text-white ml-1 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4" />
                Спосіб оплати
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Select
                value={paymentMethod}
                onValueChange={(v) =>
                  setPaymentMethod(v as "cash" | "terminal")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Виберіть спосіб оплати" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="cash">🏦 Готівка</SelectItem>
                  <SelectItem value="terminal">💳 Термінал</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setShowDiscountModal(true)}
                className="w-full h-10 flex items-center justify-center gap-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                disabled={cart.length === 0}
              >
                <Percent className="h-4 w-4" />
                <span>
                  {discountAmount > 0
                    ? `Знижка: ${discountPercent.toFixed(1)}%`
                    : "Додати знижку"}
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Total and Checkout */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Товарів:</span>
                    <span className="font-medium">{getTotalItems()} шт</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Сума товарів:</span>
                    <span className="font-medium">
                      {getSubtotal().toLocaleString()} ₴
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-red-600">
                      <span>Знижка ({discountPercent.toFixed(1)}%):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          -{discountAmount.toLocaleString()} ₴
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDiscountAmount(0);
                            setDiscountPercent(0);
                          }}
                          className="h-5 w-5 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    До сплати:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {getTotalAmount().toLocaleString()} ₴
                  </span>
                </div>

                <Button
                  onClick={handleCompleteSale}
                  disabled={cart.length === 0 || isProcessing || !isOnline}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Обробка...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="h-5 w-5" />
                      <span>Завершити продаж</span>
                    </>
                  )}
                </Button>

                {!isOnline && (
                  <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-md">
                    Для завершення продажу потрібен інтернет
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DiscountModal */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        originalAmount={getSubtotal()}
        onApplyDiscount={(amount, percent) => {
          setDiscountAmount(amount);
          setDiscountPercent(percent);
          setShowDiscountModal(false);
        }}
      />
    </div>
  );
}
