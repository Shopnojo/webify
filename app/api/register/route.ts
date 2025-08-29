import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import crypto from "crypto"

async function supabaseFromCookies(req: NextRequest) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get: (name) => req.cookies.get(name)?.value },
  })
}

export async function POST(req: NextRequest) {
  const { eventId, email, name } = await req.json()
  if (!eventId || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  const supabase = await supabaseFromCookies(req)

  // Ensure attendee record
  const { data: attendee } = await supabase
    .from("attendees")
    .upsert({ email, name })
    .select("id")
    .eq("email", email)
    .single()
  const attendeeId = attendee?.id
  const { data: registration, error: regErr } = await supabase
    .from("registrations")
    .insert({
      event_id: eventId,
      attendee_id: attendeeId,
    })
    .select("id")
    .single()
  if (regErr) return NextResponse.json({ error: regErr.message }, { status: 400 })

  // Signed QR payload
  const payload = { event_id: eventId, attendee_id: attendeeId, registration_id: registration.id, ts: Date.now() }
  const secret = process.env.QR_SIGNING_SECRET!
  const signature = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex")
  await supabase.from("tickets").insert({
    registration_id: registration.id,
    qr_payload: JSON.stringify(payload),
    qr_signature: signature,
  })

  // Send email with e-ticket link
  const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/ticket/${registration.id}`
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/email/send-ticket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: email, name, ticketUrl, payload, signature }),
  })

  return NextResponse.json({ ok: true, registration_id: registration.id })
}
