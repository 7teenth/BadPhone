import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-static";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  if (process.env.STATIC_EXPORT === "true") {
    return new Response("API не доступен в static режиме", { status: 404 });
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (process.env.STATIC_EXPORT === "true") {
    return new Response("API не доступен в static режиме", { status: 404 });
  }

  try {
    const body = await request.json();
    const name = (body?.name || "").toString().trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name }])
      .select()
      .maybeSingle();

    if (error) {
      // If conflict (duplicate) return existing
      if ((error as any).code === "23505") {
        const { data: existing } = await supabase
          .from("categories")
          .select("*")
          .eq("name", name)
          .maybeSingle();
        return NextResponse.json({ data: existing });
      }
      throw error;
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("POST /api/categories error:", err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}
