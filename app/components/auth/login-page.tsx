"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Smartphone, LogIn, UserPlus, AlertCircle, Wifi, WifiOff, Store } from 'lucide-react'
import { useApp } from "../../context/app-context"

interface StoreType {
  id: string
  name: string
}

const LoginPage = () => {
  const [loginData, setLoginData] = useState({ login: "", password: "" })
  const [registerData, setRegisterData] = useState({
    login: "",
    password: "",
    name: "",
    role: "seller" as "store_manager" | "seller",
    storeId: "",
  })
  const [loginError, setLoginError] = useState("")
  const [registerError, setRegisterError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, register, isOnline, stores } = useApp()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")

    try {
      const success = await login(loginData.login, loginData.password)
      if (!success) {
        setLoginError("Невірний логін або пароль")
      }
    } catch (error) {
      setLoginError("Помилка входу в систему")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setRegisterError("")

    if (registerData.password.length < 3) {
      setRegisterError("Пароль повинен містити мінімум 3 символи")
      setIsLoading(false)
      return
    }

    if (!registerData.storeId) {
      setRegisterError("Оберіть магазин")
      setIsLoading(false)
      return
    }

    try {
      const success = await register(
        registerData.login,
        registerData.password,
        registerData.name,
        registerData.role,
        registerData.storeId,
      )
      if (!success) {
        setRegisterError("Користувач з таким логіном вже існує")
      } else {
        // Автоматично входимо після реєстрації
        await login(registerData.login, registerData.password)
      }
    } catch (error) {
      setRegisterError("Помилка реєстрації")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-black rounded-full p-3">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">BadPhone</CardTitle>
          <p className="text-gray-600">Система управління продажами</p>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mt-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <Badge className="bg-green-600 text-white">Онлайн</Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <Badge className="bg-red-600 text-white">Офлайн</Badge>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вхід</TabsTrigger>
              <TabsTrigger value="register" disabled={!isOnline}>
                Реєстрація {!isOnline && "(потрібен інтернет)"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Логін</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginData.login}
                    onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
                    placeholder="Введіть логін"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>

                {loginError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-black hover:bg-gray-800" disabled={isLoading || !isOnline}>
                  <LogIn className="h-4 w-4 mr-2" />
                  {isLoading ? "Вхід..." : "Увійти"}
                </Button>
              </form>

              {/* Demo Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium mb-2 text-blue-800">Демо акаунти</p>
                <div className="space-y-2 text-xs text-blue-600">
                  <div className="bg-blue-100 p-2 rounded">
                    <div className="font-medium mb-1">Доступні акаунти:</div>
                    <div className="space-y-1">
                      <div>• admin / admin (Супер Адміністратор)</div>
                      <div>• manager1 / 123456 (Менеджер Центр)</div>
                      <div>• seller1 / 123456 (Продавець Олександр)</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Ім'я</Label>
                  <Input
                    id="register-name"
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="Ваше ім'я"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-login">Логін</Label>
                  <Input
                    id="register-login"
                    type="text"
                    value={registerData.login}
                    onChange={(e) => setRegisterData({ ...registerData, login: e.target.value })}
                    placeholder="Введіть логін"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-store">Магазин</Label>
                  <Select
                    value={registerData.storeId}
                    onValueChange={(value: string) => setRegisterData({ ...registerData, storeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть магазин" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store: StoreType) => (
                        <SelectItem key={store.id} value={store.id}>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            {store.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-role">Роль</Label>
                  <Select
                    value={registerData.role}
                    onValueChange={(value: "store_manager" | "seller") => setRegisterData({ ...registerData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seller">Продавець</SelectItem>
                      <SelectItem value="store_manager">Менеджер магазину</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {registerError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{registerError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-black hover:bg-gray-800" disabled={isLoading || !isOnline}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isLoading ? "Реєстрація..." : "Зареєструватися"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
export { LoginPage }
