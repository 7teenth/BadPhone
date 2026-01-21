"use client";

import { useState, useEffect } from "react";
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
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  Printer,
  AlertCircle,
  Filter,
} from "lucide-react";
import BarcodeSticker from "./barcode-sticker";
import { useApp } from "../context/app-context";
import { formatCurrency } from "@/lib/utils";
import ProductForm from "./product-form";
import { DeleteConfirmDialog } from "./delete-confirm-dialog"; 

interface ProductCatalogProps {
  onBack: () => void;
}

export function ProductCatalog({ onBack }: ProductCatalogProps) {
  const {
    products,
    stores,
    currentUser,
    currentShift,
    currentStore,
    addProduct,
    updateProduct,
    deleteProduct,
    isOnline,
    loadProducts,
    loadMoreProducts,
    productsTotalCount,
    productsLoading,
  } = useApp();
  const [localLoading, setLocalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteProduct_id, setDeleteProduct_id] = useState<string | null>(null);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [productForPrint, setProductForPrint] = useState<any | null>(null);

  const handleOpenPrint = (product: any) => {
    setProductForPrint(product);
    setShowPrintModal(true);
  };

  const handleClosePrint = () => {
    setShowPrintModal(false);
    setProductForPrint(null);
  }; 

  // Use search results if searching, otherwise use context products
  const productsToDisplay = searchTerm.trim() ? searchResults : products;

  // Фильтрация продуктов
  const filteredProducts = productsToDisplay.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm));

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStore =
      storeFilter === "all" || product.store_id === storeFilter;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in-stock" && product.quantity > 0) ||
      (stockFilter === "low-stock" &&
        product.quantity > 0 &&
        product.quantity <= 10) ||
      (stockFilter === "out-of-stock" && product.quantity === 0);

    return matchesSearch && matchesCategory && matchesStore && matchesStock;
  });

  // Получение уникальных категорий
  const categories = Array.from(
    new Set(productsToDisplay.map((p) => p.category))
  ).filter(Boolean);

  useEffect(() => {
    // ensure first page is loaded (50 items by default)
    if (products.length === 0 && currentUser && !productsLoading && !searchTerm.trim()) {
      loadProducts(currentUser).catch((e) => console.warn("loadProducts:", e));
    }
    // When search is cleared, reload first page
    if (!searchTerm.trim() && currentUser && !productsLoading && products.length > 0) {
      loadProducts(currentUser).catch((e) => console.warn("loadProducts:", e));
    }
  }, [currentUser, productsLoading, loadProducts, searchTerm]);

  // If there's an active shift, default the store filter to that store
  useEffect(() => {
    if (currentShift?.store_id) setStoreFilter(currentShift.store_id);
  }, [currentShift]);

  // ✅ When search term is entered, fetch matching products from DB server-side
  const [isSearching, setIsSearching] = useState(false);
  useEffect(() => {
    if (!searchTerm.trim() || !currentUser || !isOnline) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const searchTimer = setTimeout(async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const storeId = currentStore?.id || currentUser.store_id;

        let query = supabase
          .from("products")
          .select("*", { count: "exact" });

        // Filter by store for non-owners
        if (currentUser.role !== "owner" && storeId) {
          query = query.eq("store_id", storeId);
        }

        // Server-side search filter
        const trimmedSearch = searchTerm.trim();
        query = query.or(
          `name.ilike.%${trimmedSearch}%,brand.ilike.%${trimmedSearch}%,model.ilike.%${trimmedSearch}%,barcode.ilike.%${trimmedSearch}%`
        );

        const { data, error } = await query;

        if (error) {
          console.error("Search error:", error);
          setSearchResults([]);
          return;
        }

        // Store search results
        if (data) {
          setSearchResults(data);
        }
      } catch (err) {
        console.warn("Failed to search products:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // debounce search

    return () => clearTimeout(searchTimer);
  }, [searchTerm, currentUser, currentStore, isOnline]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setDeleteProduct_id(productId);
  };

  const confirmDelete = async () => {
    if (deleteProduct_id) {
      await deleteProduct(deleteProduct_id);
      setDeleteProduct_id(null);
    }
  };

  const handleFormSubmit = async (productData: any) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Помилка при збереженні товару");
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { status: "out", label: "Немає в наявності", color: "bg-red-500" };
    if (quantity <= 10)
      return { status: "low", label: "Мало на складі", color: "bg-yellow-500" };
    return { status: "good", label: "В наявності", color: "bg-green-500" };
  };

  const getStockStats = () => {
    const total = filteredProducts.length;
    const inStock = filteredProducts.filter((p) => p.quantity > 0).length;
    const lowStock = filteredProducts.filter(
      (p) => p.quantity > 0 && p.quantity <= 10
    ).length;
    const outOfStock = filteredProducts.filter((p) => p.quantity === 0).length;
    const totalValue = filteredProducts.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );

    return { total, inStock, lowStock, outOfStock, totalValue };
  };

  // helper to generate barcode from id if product has none
  function generateBarcodeFromId(id: string) {
    const cleanId = id.replace(/-/g, "").toUpperCase();
    let numericCode = "";

    for (let i = 0; i < Math.min(cleanId.length, 12); i++) {
      const char = cleanId[i];
      numericCode += /\d/.test(char)
        ? char
        : ((char.charCodeAt(0) - 55) % 10).toString();
    }

    numericCode = numericCode.padEnd(12, "0").slice(0, 12);

    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(numericCode[i]) * (i % 2 === 0 ? 1 : 3);
    const checkDigit = (10 - (sum % 10)) % 10;

    return numericCode + checkDigit;
  }

  const productToDelete = products.find((p) => p.id === deleteProduct_id); 

  const stats = getStockStats();
  const showLoadMore =
    typeof productsTotalCount === "number"
      ? products.length < productsTotalCount
      : false;

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Каталог товарів</h1>
          <Badge variant="secondary" className="bg-gray-700 text-white">
            {filteredProducts.length} показано
            {typeof productsTotalCount === "number"
              ? ` з ${productsTotalCount}`
              : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleAddProduct}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={!isOnline}
          >
            <Plus className="h-4 w-4 mr-2" />
            Додати товар
          </Button>
        </div>
      </header>

      {!isOnline && (
        <div className="bg-yellow-600 text-white px-6 py-2 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Режим офлайн - редагування недоступне</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Пошук товарів..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Категорія" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі категорії</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentUser?.role === "owner" && (
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Магазин" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі магазини</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Наявність" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі товари</SelectItem>
                  <SelectItem value="in-stock">В наявності</SelectItem>
                  <SelectItem value="low-stock">Мало на складі</SelectItem>
                  <SelectItem value="out-of-stock">
                    Немає в наявності
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={async () => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStoreFilter("all");
                  setStockFilter("all");
                  // Reload first page of products
                  if (currentUser) {
                    await loadProducts(currentUser);
                  }
                }}
                className="bg-transparent"
              >
                <Filter className="h-4 w-4 mr-2" />
                Скинути
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Всього товарів</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.inStock}
              </div>
              <div className="text-sm text-gray-600">В наявності</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.lowStock}
              </div>
              <div className="text-sm text-gray-600">Мало на складі</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.outOfStock}
              </div>
              <div className="text-sm text-gray-600">Немає в наявності</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.totalValue)}
              </div>
              <div className="text-sm text-gray-600">Вартість складу</div>
            </CardContent>
          </Card>
        </div>

        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              Товари не знайдено
            </h3>
            <p className="text-gray-500">
              Спробуйте змінити критерії пошуку або додайте новий товар
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.quantity);
              const store = stores.find((s) => s.id === product.store_id);

              return (
                <Card
                  key={product.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
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
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {product.brand} {product.model}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(product.price)}
                        </div>
                        <div className="text-xs text-gray-600">
                          Кількість: {product.quantity} шт
                        </div>
                        {store && (
                          <div className="text-xs text-gray-600">
                            Магазин: {store.name}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPrint(product)}
                          disabled={!isOnline}
                          className="flex-1"
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                          disabled={!isOnline}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={!isOnline}
                          className="flex-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )} 

        {showLoadMore && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={async () => {
                if (!currentUser || productsLoading || localLoading) return;
                setLocalLoading(true);
                try {
                  await loadMoreProducts(currentUser);
                } catch (e) {
                  console.error("Failed to load more products:", e);
                } finally {
                  setLocalLoading(false);
                }
              }}
              disabled={!isOnline || productsLoading || localLoading}
            >
              {productsLoading || localLoading
                ? "Завантаження..."
                : "Завантажити ще"}
            </Button>
          </div>
        )}

        {/* Print Modal */}
        {showPrintModal && productForPrint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-xs w-full max-h-[90vh] overflow-auto">
              <BarcodeSticker
                barcode={productForPrint.barcode ?? (productForPrint.id ? generateBarcodeFromId(productForPrint.id) : "")}
                productName={productForPrint.name}
                brand={productForPrint.brand}
                model={productForPrint.model}
                onClose={() => handleClosePrint()}
              />
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <ProductForm
              product={editingProduct}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <DeleteConfirmDialog
          product={products.find((p) => p.id === deleteProduct_id)!}
          title="Видалити товар?"
          message="Ви впевнені, що хочете видалити цей товар? Цю дію неможливо скасувати."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteProduct_id(null)}
        />
      )}
    </div>
  );
}
