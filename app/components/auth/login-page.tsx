"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "../../context/app-context"

export default function LoginPage() {
  const { login, register, isAuthenticated, stores } = useApp()
  const [tab, setTab] = useState<"login" | "register">("login")
  const [loginValue, setLoginValue] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id)
    }
  }, [stores, selectedStoreId])

  const handleLogin = async () => {
    setError(null)
    setLoading(true)

    if (!selectedStoreId) {
      setError("Будь ласка, оберіть магазин")
      setLoading(false)
      return
    }

    const success = await login(loginValue, password, selectedStoreId)

    setLoading(false)

    if (!success) {
      setError("Неправильний логін, пароль або магазин")
    }
  }

  const handleRegister = async () => {
    setError(null)
    setSuccess(null)

    if (!loginValue || !password || !name) {
      setError("Всі поля обов'язкові")
      return
    }

    setLoading(true)
    const success = await register(loginValue, password, name, "seller", null)
    setLoading(false)

    if (success) {
      setSuccess("Реєстрація успішна! Тепер можете увійти.")
      setTab("login")
    } else {
      setError("Не вдалося зареєструвати користувача")
    }
  }

  if (isAuthenticated) {
    return (
      <div className="text-center mt-20 text-lg font-semibold">
        Ви вже авторизовані
      </div>
    )
  }

  return (
    <Card className="max-w-md mx-auto mt-20">
      <CardHeader>
        <CardTitle>{tab === "login" ? "Вхід" : "Реєстрація"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={tab}
          onValueChange={(value: string) => {
            setError(null)
            setSuccess(null)
            setTab(value as "login" | "register")
          }}
        >
          <TabsList>
            <TabsTrigger value="login">Вхід</TabsTrigger>
            <TabsTrigger value="register">Реєстрація</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="login">Логін</Label>
              <Input
                id="login"
                type="text"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div>
              <Label htmlFor="store-select">Оберіть магазин</Label>
              <select
                id="store-select"
                value={selectedStoreId || ""}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleLogin} disabled={loading}>
              Увійти
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="login-reg">Логін</Label>
              <Input
                id="login-reg"
                type="text"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <Label htmlFor="password-reg">Пароль</Label>
              <Input
                id="password-reg"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="name">Ім'я</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <Button onClick={handleRegister} disabled={loading}>
              Зареєструватися
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
