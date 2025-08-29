import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import crypto from "crypto"

async function supabaseFromCookies(req: NextRequest) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get: (name) => req.cookies.get(name)?.value },
  })
}

export async function POST(req: NextRequest) {
  const text = await req.text()
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: "Invalid QR" }, { status: 400 })
  }
  const { event_id, attendee_id, registration_id, ts } = parsed
  const sig = (parsed.signature as string) || ""
  const secret = process.env.QR_SIGNING_SECRET!
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify({ event_id, attendee_id, registration_id, ts }))
    .digest("hex")
  if (sig !== expected) return NextResponse.json({ error: "Signature mismatch" }, { status: 400 })

  const supabase = await supabaseFromCookies(req)
  const { error } = await supabase
    .from("registrations")
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq("id", registration_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, attendee_id })
}
