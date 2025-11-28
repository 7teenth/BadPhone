import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-static"
export const revalidate = 0

console.log("Route.ts (stores) loaded, NODE_ENV:", process.env.NODE_ENV)
console.log("STATIC_EXPORT:", process.env.STATIC_EXPORT)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  if (process.env.STATIC_EXPORT === "true") {
    return new Response("API not available in static export mode", { status: 404 })
  }

  try {
    const { data, error } = await supabase.from("stores").select("*")
    if (error) {
      console.error("Supabase error loading stores:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error("Error in GET /api/stores:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
