import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get("eventId")
  const { messages } = await req.json()
  if (!eventId) return NextResponse.json({ error: "Missing event" }, { status: 400 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: () => undefined } },
  )
  const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single()
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("event_id", eventId)
    .order("start_time", { ascending: true })

  const lastUser = messages[messages.length - 1]?.content || ""
  const context = `Event: ${event?.title} at ${event?.venue} from ${event?.start_time} to ${event?.end_time}. Sessions: ${sessions?.map((s) => `${s.title} (${s.room}) ${s.start_time}-${s.end_time}`).join("; ")}`

  const { text } = await generateText({
    model: xai("grok-4"),
    system:
      "Answer attendee questions concisely using provided event context only. If unknown, say you don't know and guide to registration or info desk.",
    prompt: `Context:\n${context}\n\nQuestion:\n${lastUser}`,
  })
  return NextResponse.json({ text })
}
