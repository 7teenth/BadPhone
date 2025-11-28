import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-static"
export const revalidate = 0

console.log("Route.ts (stores/[id]) loaded, NODE_ENV:", process.env.NODE_ENV)
console.log("STATIC_EXPORT:", process.env.STATIC_EXPORT)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.STATIC_EXPORT === "true") {
    return new Response("API not available in static export mode", { status: 404 })
  }

  try {
    const { id } = await params
    console.log("GET /api/stores/:id request for id:", id)

    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid store id" }, { status: 400 })
    }

    const { data, error } = await supabase.from("stores").select("*").eq("id", id).maybeSingle()
    if (error) {
      console.error("Supabase error fetching store:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Error in GET /api/stores/[id]:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
