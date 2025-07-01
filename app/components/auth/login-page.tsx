"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "../../context/app-context"

export default function LoginPage() {
  const { login, register, isAuthenticated } = useApp()
  const [tab, setTab] = useState<"login" | "register">("login")
  const [loginValue, setLoginValue] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError(null)
    setLoading(true)
    const success = await login(loginValue, password)
    setLoading(false)
    if (!success) {
      setError("Неправильний логін або пароль")
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
    // Передаём пустую строку для storeId, т.к. поле убрали
    const success = await register(loginValue, password, name, "seller", null);
    setLoading(false)

    if (success) {
      setSuccess("Реєстрація успішна! Тепер можете увійти.")
      setTab("login")
      // При необходимости можно очистить поля:
      // setLoginValue(""); setPassword(""); setName("");
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
            {/* Поле для магазину убрано */}
            <Button onClick={handleRegister} disabled={loading}>
              Зареєструватися
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
