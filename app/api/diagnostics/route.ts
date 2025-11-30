import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server diagnostics endpoint — best-effort logging & optional DB insert.
// When the client observes a Supabase error that appears empty (JSON.stringify -> "{}")
// it can POST an object here. This handler will always log the payload to the server
// logs and will attempt to write it to a `diagnostics` table in Supabase if the
// environment is configured. If the table doesn't exist or the server key isn't
// provided, the handler still returns 200 so the client remains fast.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServer = url && key ? createClient(url, key) : null;

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    // Always log server-side for easy inspection in Cloud logs / dev
    console.error("[diagnostics] payload:", payload);

    if (supabaseServer) {
      try {
        // Optional: attempt to write into a diagnostics table (idempotent best-effort)
        // Table schema attempt (best-effort): { id, ctx, message, details -> jsonb, created_at }
        await supabaseServer.from("diagnostics").insert({
          ctx: payload.ctx || "unknown",
          message: payload.error_summary || payload.message || null,
          details: payload,
          meta: {
            client_user_id: payload.client_user_id || null,
            client_store_id: payload.client_store_id || null,
          },
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        // Table might not exist — that's fine; we still keep server logs above
        console.warn("[diagnostics] inserting to DB failed (table may not exist):", e);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[diagnostics] failed to parse payload:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
