"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Search, User, Trash2, Store, Shield, UserCheck, Filter, AlertCircle } from "lucide-react"
import { useApp } from "../context/app-context"
import { DeleteConfirmDialogUser } from "../components/delete-confirm-dialog-user"


interface UsersManagementProps {
  onBack: () => void
}

export function UsersManagement({ onBack }: UsersManagementProps) {
  const { users, stores, register, deleteUser, isOnline } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [storeFilter, setStoreFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    name: "",
    role: "seller" as "owner" | "seller",
    storeId: "",
  })

  // Фильтрация пользователей
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.login.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStore = storeFilter === "all" || user.store_id === storeFilter

    return matchesSearch && matchesRole && matchesStore
  })

  const handleAddUser = () => {
    setFormData({
      login: "",
      password: "",
      name: "",
      role: "seller",
      storeId: "",
    })
    setShowForm(true)
  }

  const handleDeleteUser = (userId: string) => {
    setDeleteUserId(userId)
  }

  const confirmDelete = async () => {
    if (deleteUserId) {
      const success = await deleteUser(deleteUserId)
      if (success) {
        alert("Користувача успішно видалено")
      } else {
        alert("Помилка при видаленні користувача")
      }
      setDeleteUserId(null)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.login || !formData.password || !formData.name) {
      alert("Заповніть всі обов'язкові поля")
      return
    }

    const success = await register(
      formData.login,
      formData.password,
      formData.name,
      formData.role,
      formData.storeId || null,
    )

    if (success) {
      alert("Користувача успішно створено")
      setShowForm(false)
      setFormData({
        login: "",
        password: "",
        name: "",
        role: "seller",
        storeId: "",
      })
    } else {
      alert("Помилка при створенні користувача")
    }
  }

  const getUserStats = () => {
    const total = filteredUsers.length
    const owners = filteredUsers.filter((u) => u.role === "owner").length
    const sellers = filteredUsers.filter((u) => u.role === "seller").length
    const withStores = filteredUsers.filter((u) => u.store_id).length

    return { total, owners, sellers, withStores }
  }

  const stats = getUserStats()

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-800">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Управління користувачами</h1>
          <Badge variant="secondary" className="bg-gray-700 text-white">
            {filteredUsers.length} користувачів
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleAddUser} className="bg-green-600 hover:bg-green-700 text-white" disabled={!isOnline}>
            <Plus className="h-4 w-4 mr-2" />
            Додати користувача
          </Button>
        </div>
      </header>

      {!isOnline && (
        <div className="bg-yellow-600 text-white px-6 py-2 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Режим офлайн - управління користувачами недоступне</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Пошук користувачів..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі ролі</SelectItem>
                  <SelectItem value="owner">Власники</SelectItem>
                  <SelectItem value="seller">Продавці</SelectItem>
                </SelectContent>
              </Select>

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

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setRoleFilter("all")
                  setStoreFilter("all")
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Всього користувачів</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.owners}</div>
              <div className="text-sm text-gray-600">Власників</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.sellers}</div>
              <div className="text-sm text-gray-600">Продавців</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.withStores}</div>
              <div className="text-sm text-gray-600">З магазинами</div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card className="p-12 text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">Користувачі не знайдено</h3>
            <p className="text-gray-500">Спробуйте змінити критерії пошуку або додайте нового користувача</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const store = stores.find((s) => s.id === user.store_id)

              return (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.role === "owner" ? (
                            <Shield className="h-6 w-6 text-purple-600" />
                          ) : (
                            <UserCheck className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{user.name}</h3>
                            <Badge
                              variant={user.role === "owner" ? "default" : "secondary"}
                              className={user.role === "owner" ? "bg-purple-600" : "bg-green-600"}
                            >
                              {user.role === "owner" ? "Власник" : "Продавець"}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Логін: {user.login}</div>
                            {store && (
                              <div className="flex items-center gap-1">
                                <Store className="h-4 w-4" />
                                <span>Магазин: {store.name}</span>
                              </div>
                            )}
                            <div>Створено: {new Date(user.created_at).toLocaleDateString("uk-UA")}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={!isOnline}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Add User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Додати користувача</h3>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                ✕
              </Button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ім'я *</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Введіть ім'я користувача"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Логін *</label>
                <Input
                  type="text"
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  placeholder="Введіть логін"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Пароль *</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Введіть пароль"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Роль</label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "owner" | "seller") => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seller">Продавець</SelectItem>
                    <SelectItem value="owner">Власник</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Магазин</label>
                <Select
                  value={formData.storeId}
                  onValueChange={(value) => setFormData({ ...formData, storeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Виберіть магазин" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без магазину</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Скасувати
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Створити
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteUserId && (
        <DeleteConfirmDialogUser
          user={users.find((user) => user.id === deleteUserId)?.name || ""}
          title="Видалити користувача?"
          message="Ви впевнені, що хочете видалити цього користувача? Цю дію неможливо скасувати."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteUserId(null)}
        />
      )}
    </div>
  )
}
