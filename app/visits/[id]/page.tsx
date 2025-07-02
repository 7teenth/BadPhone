"use client"

import { useEffect, useState } from "react"

interface Visit {
  id: string
  title: string
  sale_amount: number
  created_at: string
  // Добавь другие поля, если нужно
}

interface VisitPageProps {
  params: { id: string }
}

export default function VisitPage({ params }: VisitPageProps) {
  const [visit, setVisit] = useState<Visit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVisit() {
      try {
        // Заменяй URL на свой реальный API или локальный источник данных
        const res = await fetch(`/api/visits/${params.id}`)

        if (!res.ok) {
          throw new Error("Помилка при завантаженні візиту")
        }
        const data = await res.json()
        setVisit(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchVisit()
  }, [params.id])

  if (loading) return <div className="p-6">Завантаження...</div>

  if (error) return (
    <div className="p-6 text-red-600">
      Помилка: {error}
    </div>
  )

  if (!visit) return (
    <div className="p-6 text-gray-600">
      Візит не знайдено
    </div>
  )

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">{visit.title}</h1>
      <p className="mb-2">
        <strong>Сума продажу:</strong> {visit.sale_amount.toLocaleString()} ₴
      </p>
      <p className="mb-2">
        <strong>Дата та час:</strong> {new Date(visit.created_at).toLocaleString("uk-UA")}
      </p>
      {/* Добавь сюда другие детали визита */}
    </div>
  )
}
