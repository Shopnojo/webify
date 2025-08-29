"use client"
import { useState } from "react"

export default function ScheduleAssistant({ params }: { params: { id: string } }) {
  const [sessions, setSessions] = useState<{ title: string; durationMinutes: number; track?: string }[]>([])
  const [title, setTitle] = useState("")
  const [dur, setDur] = useState<number>(30)
  const [track, setTrack] = useState("")
  const [result, setResult] = useState<string | null>(null)

  function add() {
    if (!title.trim() || !dur) return
    setSessions((s) => [...s, { title, durationMinutes: dur, track: track || undefined }])
    setTitle("")
    setDur(30)
    setTrack("")
  }

  async function optimize() {
    const window = { start: "09:00", end: "17:00" }
    const res = await fetch("/api/ai/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessions, eventWindow: window }),
    })
    const json = await res.json()
    setResult(json.text)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-4">
      <h1 className="font-nav text-2xl">AI Schedule Assistant</h1>
      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className="rounded border border-border px-3 py-2"
            placeholder="Session title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="rounded border border-border px-3 py-2"
            type="number"
            min={5}
            step={5}
            value={dur}
            onChange={(e) => setDur(Number.parseInt(e.target.value || "30", 10))}
          />
          <input
            className="rounded border border-border px-3 py-2"
            placeholder="Track/Room"
            value={track}
            onChange={(e) => setTrack(e.target.value)}
          />
        </div>
        <button onClick={add} className="rounded bg-primary px-3 py-2 text-white">
          Add session
        </button>
      </div>
      <div className="rounded border border-border p-3">
        <div className="font-medium mb-2">Sessions</div>
        <ul className="text-sm space-y-1">
          {sessions.map((s, i) => (
            <li key={i}>
              • {s.title} — {s.durationMinutes} min {s.track ? `· ${s.track}` : ""}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={optimize} className="rounded bg-primary px-3 py-2 text-white">
        Optimize Schedule
      </button>
      {result && <div className="rounded border border-border p-3 text-sm whitespace-pre-wrap">{result}</div>}
    </div>
  )
}
