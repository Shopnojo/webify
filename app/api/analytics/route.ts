import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => req.cookies.get(name)?.value } },
  )
  await supabase.from("analytics_events").insert({
    name: body.event,
    payload: body.payload || {},
    ts: new Date(body.ts || Date.now()).toISOString(),
  })
  return NextResponse.json({ ok: true })
}
