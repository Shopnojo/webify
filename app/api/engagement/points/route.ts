import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

function supabaseFromCookies(req: NextRequest) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get: (name) => req.cookies.get(name)?.value },
  })
}

export async function POST(req: NextRequest) {
  try {
    const { event_id, actor_id, actor_name, delta = 0, reason } = await req.json()
    if (!event_id || !actor_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    const supabase = supabaseFromCookies(req)
    const { error } = await (await supabase).from("leaderboard_events").insert({
      event_id,
      actor_id,
      actor_name,
      delta,
      reason,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}
