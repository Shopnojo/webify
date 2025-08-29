import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"

export async function POST(req: NextRequest) {
  const { sessions, eventWindow } = await req.json()
  // sessions: [{ title, durationMinutes, preferredTracks, speakers, constraints }]
  const { text } = await generateText({
    model: xai("grok-4"),
    system:
      "You are an expert event scheduler. Create a schedule with no overlapping sessions per track and balanced durations.",
    prompt: `Event window: ${JSON.stringify(eventWindow)}.\nSessions: ${JSON.stringify(sessions)}.\nReturn JSON with [{title, start, end, room/track}] with justified scheduling.`,
  })
  return NextResponse.json({ text })
}
