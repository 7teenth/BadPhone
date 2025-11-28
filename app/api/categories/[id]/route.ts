import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-static";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.STATIC_EXPORT === "true") {
    return new Response("API не доступен в static режиме", { status: 404 });
  }

  try {
    const { id } = await params;
    const { data, error } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/categories/[id] error:", err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.STATIC_EXPORT === "true") {
    return new Response("API не доступен в static режиме", { status: 404 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const name = (body?.name || "").toString().trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const { data, error } = await supabase.from("categories").update({ name, updated_at: new Date() }).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error("PATCH /api/categories/[id] error:", err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.STATIC_EXPORT === "true") {
    return new Response("API не доступен в static режиме", { status: 404 });
  }

  try {
    const { id } = await params;
    const { data, error } = await supabase.from("categories").delete().eq("id", id).select();
    if (error) throw error;
    return NextResponse.json({ deleted: data });
  } catch (err) {
    console.error("DELETE /api/categories/[id] error:", err);
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}
