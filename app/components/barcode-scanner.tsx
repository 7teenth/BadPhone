"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Camera,
  Keyboard,
  Zap,
  Calculator,
  History,
  Settings,
  Package,
  TrendingUp,
  Store,
  Smartphone,
  Tablet,
  Laptop,
  Headphones,
  Battery,
  Shield,
  Search,
  Plus,
  X,
  Check,
  AlertCircle,
  Info,
} from "lucide-react"

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
}

export function BarcodeScanner({ onBarcodeDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const [activeMode, setActiveMode] = useState<
    "camera" | "manual" | "profit" | "templates" | "history" | "generator" | "settings"
  >("camera")
  const [error, setError] = useState<string | null>(null)

  // Profit Calculator State
  const [costPrice, setCostPrice] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [profitMargin, setProfitMargin] = useState("")

  // Quick Templates State
  const [selectedCategory, setSelectedCategory] = useState("")
  const [customTemplate, setCustomTemplate] = useState({
    name: "",
    category: "",
    brand: "",
    basePrice: "",
    margin: "30",
  })

  // Recent Products State
  const [recentProducts] = useState([
    { barcode: "1234567890123", name: "iPhone 14 Pro", price: 45000, scannedAt: new Date() },
    { barcode: "2345678901234", name: "Samsung Galaxy S23", price: 35000, scannedAt: new Date(Date.now() - 86400000) },
    { barcode: "3456789012345", name: "AirPods Pro", price: 8500, scannedAt: new Date(Date.now() - 172800000) },
  ])

  // Barcode Generator State
  const [generatorText, setGeneratorText] = useState("")
  const [generatorType, setGeneratorType] = useState("EAN13")
  const [generatedBarcode, setGeneratedBarcode] = useState("")

  // Settings State
  const [scanSettings, setScanSettings] = useState({
    autoFocus: true,
    flashlight: false,
    soundEnabled: true,
    vibrationEnabled: true,
    scanDelay: "500",
    cameraResolution: "720p",
  })

  // Multi-store State
  const [selectedStore, setSelectedStore] = useState("store1")
  const stores = [
    { id: "store1", name: "Центральний магазин", address: "вул. Хрещатик, 1" },
    { id: "store2", name: "Філія Оболонь", address: "пр. Оболонський, 15" },
    { id: "store3", name: "Філія Позняки", address: "вул. Драгоманова, 8" },
  ]

  const productCategories = [
    { id: "smartphones", name: "Смартфони", icon: Smartphone, margin: 25 },
    { id: "tablets", name: "Планшети", icon: Tablet, margin: 30 },
    { id: "laptops", name: "Ноутбуки", icon: Laptop, margin: 20 },
    { id: "headphones", name: "Навушники", icon: Headphones, margin: 40 },
    { id: "accessories", name: "Аксесуари", icon: Battery, margin: 50 },
    { id: "cases", name: "Чохли", icon: Shield, margin: 60 },
  ]

  useEffect(() => {
    if (activeMode === "camera" && isScanning) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [activeMode, isScanning])

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      setError("Не вдалося отримати доступ до камери")
      console.error("Camera error:", err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onBarcodeDetected(manualBarcode.trim())
      setManualBarcode("")
    }
  }

  const calculateProfit = () => {
    const cost = Number.parseFloat(costPrice) || 0
    const selling = Number.parseFloat(sellingPrice) || 0
    const qty = Number.parseInt(quantity) || 1

    const profit = (selling - cost) * qty
    const margin = cost > 0 ? ((selling - cost) / cost) * 100 : 0

    return { profit, margin }
  }

  const applyTemplate = (category: any) => {
    const basePrice = Number.parseFloat(customTemplate.basePrice) || 0
    const margin = category.margin
    const sellingPrice = basePrice * (1 + margin / 100)

    setSellingPrice(sellingPrice.toFixed(2))
    setProfitMargin(margin.toString())
  }

  const generateBarcode = () => {
    // Simple barcode generation simulation
    let code = ""
    const length = generatorType === "EAN13" ? 13 : generatorType === "UPC" ? 12 : 8

    if (generatorText) {
      // Use provided text as base
      code = generatorText.padEnd(length, "0").substring(0, length)
    } else {
      // Generate random code
      for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10)
      }
    }

    setGeneratedBarcode(code)
  }

  const { profit, margin } = calculateProfit()

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Розширений сканер штрих-кодів
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeMode} onValueChange={(value: any) => setActiveMode(value)}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="camera" className="flex items-center gap-1">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Камера</span>
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-1">
                <Keyboard className="h-4 w-4" />
                <span className="hidden sm:inline">Ручний</span>
              </TabsTrigger>
              <TabsTrigger value="profit" className="flex items-center gap-1">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Прибуток</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Шаблони</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Історія</span>
              </TabsTrigger>
              <TabsTrigger value="generator" className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Генератор</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Налаштування</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />

                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-center text-white">
                        <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Натисніть "Почати сканування" для активації камери</p>
                      </div>
                    </div>
                  )}

                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-green-500 rounded-lg" style={{ width: "60%", height: "30%" }}>
                        <div className="w-full h-full border-2 border-dashed border-green-300 rounded-lg animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => setIsScanning(!isScanning)}
                    className={isScanning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                  >
                    {isScanning ? "Зупинити сканування" : "Почати сканування"}
                  </Button>

                  {isScanning && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Toggle flashlight simulation
                        setScanSettings((prev) => ({ ...prev, flashlight: !prev.flashlight }))
                      }}
                      className={scanSettings.flashlight ? "bg-yellow-100" : ""}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {scanSettings.flashlight ? "Вимкнути" : "Увімкнути"} спалах
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Введіть штрих-код вручну:</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      placeholder="Введіть або вставте штрих-код"
                      onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
                    />
                    <Button onClick={handleManualSubmit} disabled={!manualBarcode.trim()}>
                      <Search className="h-4 w-4 mr-2" />
                      Знайти
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Підказки для введення:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>EAN-13: 13 цифр (наприклад: 1234567890123)</li>
                        <li>UPC-A: 12 цифр (наприклад: 123456789012)</li>
                        <li>EAN-8: 8 цифр (наприклад: 12345678)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="profit" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Калькулятор прибутку
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Собівартість (₴)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Ціна продажу (₴)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Кількість</label>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Бажана маржа (%)</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={profitMargin}
                          onChange={(e) => {
                            setProfitMargin(e.target.value)
                            const cost = Number.parseFloat(costPrice) || 0
                            const margin = Number.parseFloat(e.target.value) || 0
                            if (cost > 0) {
                              setSellingPrice((cost * (1 + margin / 100)).toFixed(2))
                            }
                          }}
                          placeholder="30"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            const cost = Number.parseFloat(costPrice) || 0
                            const margin = Number.parseFloat(profitMargin) || 0
                            if (cost > 0) {
                              setSellingPrice((cost * (1 + margin / 100)).toFixed(2))
                            }
                          }}
                        >
                          Розрахувати
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Результати
                  </h3>

                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{profit.toLocaleString()} ₴</div>
                          <div className="text-sm text-gray-600">Прибуток</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{margin.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Маржа</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {(
                              (Number.parseFloat(sellingPrice) || 0) * (Number.parseInt(quantity) || 1)
                            ).toLocaleString()}{" "}
                            ₴
                          </div>
                          <div className="text-sm text-gray-600">Загальна сума</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Швидкі шаблони за категоріями
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {productCategories.map((category) => {
                      const Icon = category.icon
                      return (
                        <Button
                          key={category.id}
                          variant="outline"
                          className="h-20 flex flex-col items-center gap-2 hover:bg-blue-50 bg-transparent"
                          onClick={() => applyTemplate(category)}
                        >
                          <Icon className="h-6 w-6" />
                          <div className="text-center">
                            <div className="text-sm font-medium">{category.name}</div>
                            <div className="text-xs text-gray-500">{category.margin}% маржа</div>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Створити власний шаблон</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Input
                        placeholder="Назва товару"
                        value={customTemplate.name}
                        onChange={(e) => setCustomTemplate((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Категорія"
                        value={customTemplate.category}
                        onChange={(e) => setCustomTemplate((prev) => ({ ...prev, category: e.target.value }))}
                      />
                      <Input
                        placeholder="Бренд"
                        value={customTemplate.brand}
                        onChange={(e) => setCustomTemplate((prev) => ({ ...prev, brand: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-3">
                      <Input
                        type="number"
                        placeholder="Базова ціна (₴)"
                        value={customTemplate.basePrice}
                        onChange={(e) => setCustomTemplate((prev) => ({ ...prev, basePrice: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="Маржа (%)"
                        value={customTemplate.margin}
                        onChange={(e) => setCustomTemplate((prev) => ({ ...prev, margin: e.target.value }))}
                      />
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Зберегти шаблон
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Останні відскановані товари
                </h3>

                <div className="space-y-3">
                  {recentProducts.map((product, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-600 font-mono">{product.barcode}</p>
                            <p className="text-sm text-gray-500">
                              {product.scannedAt.toLocaleDateString("uk-UA")} о{" "}
                              {product.scannedAt.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">{product.price.toLocaleString()} ₴</div>
                            <Button size="sm" variant="outline" onClick={() => onBarcodeDetected(product.barcode)}>
                              Повторити пошук
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {recentProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Історія сканування порожня</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="generator" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Генератор штрих-кодів
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Тип штрих-коду</label>
                        <Select value={generatorType} onValueChange={setGeneratorType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EAN13">EAN-13 (13 цифр)</SelectItem>
                            <SelectItem value="UPC">UPC-A (12 цифр)</SelectItem>
                            <SelectItem value="EAN8">EAN-8 (8 цифр)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Текст для коду (опціонально)</label>
                        <Input
                          value={generatorText}
                          onChange={(e) => setGeneratorText(e.target.value)}
                          placeholder="Залиште порожнім для випадкового коду"
                        />
                      </div>

                      <Button onClick={generateBarcode} className="w-full">
                        Згенерувати штрих-код
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {generatedBarcode && (
                        <div className="text-center p-4 border rounded-lg bg-white">
                          <div className="mb-4">
                            <div className="font-mono text-lg font-bold">{generatedBarcode}</div>
                            <div className="text-sm text-gray-600">{generatorType}</div>
                          </div>

                          {/* Простий візуальний штр-код */}
                          <div className="flex justify-center mb-4">
                            <div className="flex">
                              {generatedBarcode.split("").map((digit, index) => (
                                <div
                                  key={index}
                                  className="bg-black"
                                  style={{
                                    width: `${2 + (Number.parseInt(digit) % 3)}px`,
                                    height: "60px",
                                    marginRight: "1px",
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigator.clipboard.writeText(generatedBarcode)}
                            >
                              Копіювати
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onBarcodeDetected(generatedBarcode)}>
                              Використати
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Налаштування сканера
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Камера</h4>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Автофокус</label>
                          <Button
                            size="sm"
                            variant={scanSettings.autoFocus ? "default" : "outline"}
                            onClick={() => setScanSettings((prev) => ({ ...prev, autoFocus: !prev.autoFocus }))}
                          >
                            {scanSettings.autoFocus ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Роздільна здатність</label>
                          <Select
                            value={scanSettings.cameraResolution}
                            onValueChange={(value) => setScanSettings((prev) => ({ ...prev, cameraResolution: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="480p">480p (640x480)</SelectItem>
                              <SelectItem value="720p">720p (1280x720)</SelectItem>
                              <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Зворотний зв'язок</h4>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Звукові сигнали</label>
                          <Button
                            size="sm"
                            variant={scanSettings.soundEnabled ? "default" : "outline"}
                            onClick={() => setScanSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                          >
                            {scanSettings.soundEnabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-sm">Вібрація</label>
                          <Button
                            size="sm"
                            variant={scanSettings.vibrationEnabled ? "default" : "outline"}
                            onClick={() =>
                              setScanSettings((prev) => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }))
                            }
                          >
                            {scanSettings.vibrationEnabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Затримка сканування (мс)</label>
                          <Select
                            value={scanSettings.scanDelay}
                            onValueChange={(value) => setScanSettings((prev) => ({ ...prev, scanDelay: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Без затримки</SelectItem>
                              <SelectItem value="250">250 мс</SelectItem>
                              <SelectItem value="500">500 мс</SelectItem>
                              <SelectItem value="1000">1 секунда</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Мульти-магазин
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Активний магазин</label>
                      <Select value={selectedStore} onValueChange={setSelectedStore}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              <div>
                                <div className="font-medium">{store.name}</div>
                                <div className="text-sm text-gray-500">{store.address}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Поточний магазин:</p>
                          <p>{stores.find((s) => s.id === selectedStore)?.name}</p>
                          <p className="text-blue-600">{stores.find((s) => s.id === selectedStore)?.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
