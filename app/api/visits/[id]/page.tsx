"use client"

import { useEffect, useState } from "react"
import { useParams, notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Visit {
  id: string
  title: string
  sale_amount: number
  created_at: string
}

export default function VisitPage() {
  const { id } = useParams()
  const [visit, setVisit] = useState<Visit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        const res = await fetch(`/api/visits/${id}`)
        if (!res.ok) return notFound()

        const data = await res.json()
        setVisit(data)
      } catch (error) {
        console.error("Failed to fetch visit", error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchVisit()
  }, [id])

  if (loading) return <p className="p-6">Завантаження...</p>
  if (!visit) return notFound()

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <Link href="/" className="block">
        <Button variant="outline">← Назад</Button>
      </Link>

      <Card>
        <CardContent className="p-6 space-y-2">
          <h2 className="text-2xl font-bold">{visit.title}</h2>
          <p className="text-gray-700">Сума продажу: {visit.sale_amount.toLocaleString()} грн</p>
          <p className="text-gray-500 text-sm">
            Створено:{" "}
            {new Date(visit.created_at).toLocaleString("uk-UA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}