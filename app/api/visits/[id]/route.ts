import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-static"
export const revalidate = 0

console.log("Route.ts загружен, NODE_ENV:", process.env.NODE_ENV)
console.log("STATIC_EXPORT:", process.env.STATIC_EXPORT)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.STATIC_EXPORT === "true") {
    return new Response("API не доступен в static режиме", { status: 404 })
  }

  try {
    const { id } = await params
    console.log("GET запрос для ID:", id)
    return NextResponse.json({
      message: `API маршрут работает для ID: ${id}`,
      method: "GET",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Ошибка GET:", error)
    return NextResponse.json({ error: "Ошибка GET" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.STATIC_EXPORT === "true") {
    return new Response("API не доступен в static режиме", { status: 404 })
  }

  try {
    const { id } = await params
    console.log("DELETE запрос получен для ID:", id)

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      console.log("Неверный формат ID:", id)
      return NextResponse.json({ error: "Неверный формат ID" }, { status: 400 })
    }

    const { data, error } = await supabase.from("visits").delete().eq("id", id).select()

    if (error) {
      console.error("Ошибка при удалении из Supabase:", error)
      return NextResponse.json({ error: `Ошибка Supabase: ${error.message}` }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.log("Запись не найдена для удаления")
      return NextResponse.json({ error: "Визит не найден" }, { status: 404 })
    }

    console.log("Визит успешно удален из Supabase:", data)
    return NextResponse.json({
      success: true,
      message: "Визит успешно удален из базы данных",
      deletedId: id,
      deletedData: data,
    })
  } catch (error) {
    console.error("Ошибка в DELETE обработчике:", error)
    return NextResponse.json(
      {
        error: "Внутренняя ошибка сервера",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
