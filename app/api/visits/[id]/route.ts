import { NextResponse } from "next/server"

// Пример фиктивных данных визитов
const visits = [
  {
    id: "1",
    title: "Візит 1",
    sale_amount: 1500,
    created_at: "2025-07-01T10:00:00Z",
  },
  {
    id: "2",
    title: "Візит 2",
    sale_amount: 2300,
    created_at: "2025-07-02T11:30:00Z",
  },
  // Добавь реальные данные или подключи БД
]

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params

  const visit = visits.find(v => v.id === id)

  if (!visit) {
    return NextResponse.json({ error: "Візит не знайдено" }, { status: 404 })
  }

  return NextResponse.json(visit)
}
