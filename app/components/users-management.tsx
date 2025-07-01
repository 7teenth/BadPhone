"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Trash2, User, UserPlus, AlertCircle, CheckCircle } from "lucide-react"
import { useApp } from "../context/app-context"

interface UsersManagementProps {
  onBack: () => void
}

export function UsersManagement({ onBack }: UsersManagementProps) {
  const { users, currentUser, currentStore, register, deleteUser, isOnline } = useApp()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    name: "",
    // Роль убираем, всегда seller
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Проверяем, есть ли уже владелец
  const ownerExists = users.some(user => user.role === "owner")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (formData.password.length < 3) {
      setError("Пароль повинен містити мінімум 3 символи")
      setIsLoading(false)
      return
    }

    if (!currentStore) {
      setError("Магазин не знайдено")
      setIsLoading(false)
      return
    }

    try {
      // Всегда добавляем с ролью seller
      const success = await register(
        formData.login.trim(),
        formData.password,
        formData.name.trim(),
        "seller",
        currentStore.id
      )

      if (success) {
        setSuccess("Користувач успішно доданий!")
        setFormData({
          login: "",
          password: "",
          name: "",
        })
        setShowAddForm(false)
      } else {
        setError("Користувач з таким логіном вже існує")
      }
    } catch (error) {
      console.error("Помилка при додаванні користувача:", error)
      setError("Помилка при додаванні користувача")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!deleteConfirm) return

    setIsLoading(true)
    try {
      const success = await deleteUser(userId)
      if (success) {
        setSuccess("Користувач успішно видалений!")
        setDeleteConfirm(null)
      } else {
        setError("Помилка при видаленні користувача")
      }
    } catch (error) {
      console.error("Помилка при видаленні користувача:", error)
      setError("Помилка при видаленні користувача")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (currentUser?.role !== "owner") {
    return (
      <div className="min-h-screen bg-gray-200">
        <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Управління користувачами</h1>
        </header>
        <div className="p-6">
          <Card className="p-12 text-center">
            <h3 className="text-xl font-medium text-gray-600 mb-2">Доступ заборонено</h3>
            <p className="text-gray-500">Тільки власник може управляти користувачами</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Управління користувачами</h1>
        <Badge className="bg-yellow-600 text-black">Тільки власник</Badge>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Add User Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Користувачі магазину: {currentStore?.name}</h2>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-black hover:bg-gray-800 text-white"
            disabled={!isOnline || isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Додати користувача
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Add User Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Додати нового користувача
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ім'я *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ім'я користувача"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login">Логін *</Label>
                    <Input
                      id="login"
                      value={formData.login}
                      onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                      placeholder="Логін для входу"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Пароль *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isLoading ? "Додавання..." : "Додати користувача"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="bg-transparent"
                    disabled={isLoading}
                  >
                    Скасувати
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-gray-600">@{user.login}</p>
                    </div>
                  </div>
                  {user.id !== currentUser?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(user.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Роль:</span>
                    <Badge variant={user.role === "owner" ? "default" : "secondary"}>
                      {user.role === "owner" ? "Власник" : "Продавець"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Дата реєстрації:</span>
                    <span className="text-sm">{formatDate(user.created_at)}</span>
                  </div>
                  {user.id === currentUser?.id && (
                    <Badge className="w-full justify-center bg-blue-600 text-white">Це ви</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card className="p-12 text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">Користувачі не знайдені</h3>
            <p className="text-gray-500">Додайте першого користувача для початку роботи</p>
          </Card>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center text-red-600">Підтвердження видалення</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center">
                  Ви впевнені, що хочете видалити цього користувача? Цю дію неможливо скасувати!
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-transparent"
                    disabled={isLoading}
                  >
                    Скасувати
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteUser(deleteConfirm)}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? "Видалення..." : "Видалити"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
