"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient as createSupabaseClient } from "../../../../../../lib/supabase/client"

export default function NewSessionPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const eventId = params?.id as string

  const [title, setTitle] = useState("")
  const [room, setRoom] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
    return createSupabaseClient()
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
      return
    }
    setSaving(true)
    setError(null)

    const { error } = await supabase.from("sessions").insert({
      event_id: eventId,
      title,
      room,
      start_time: start ? new Date(start).toISOString() : null,
      end_time: end ? new Date(end).toISOString() : null,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      router.push(`/organizer/events/${eventId}`)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-nav text-2xl mb-4">Add Session</h1>
      {!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
        <div className="mb-4 rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          Supabase variables missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then refresh.
        </div>
      ) : null}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <form onSubmit={onCreate} className="space-y-4">
        <label className="block">
          <span className="sr-only">Title</span>
          <input
            className="w-full rounded border border-border px-3 py-2"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="sr-only">Room</span>
          <input
            className="w-full rounded border border-border px-3 py-2"
            placeholder="Room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="sr-only">Start time</span>
            <input
              className="w-full rounded border border-border px-3 py-2"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="sr-only">End time</span>
            <input
              className="w-full rounded border border-border px-3 py-2"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button disabled={saving} className="rounded bg-primary px-4 py-2 text-white">
            {saving ? "Creating..." : "Create session"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/organizer/events/${eventId}`)}
            className="rounded border border-border px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
