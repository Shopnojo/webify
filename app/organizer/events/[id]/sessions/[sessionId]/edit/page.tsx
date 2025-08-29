"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient as createSupabaseClient } from "../../../../../../../lib/supabase/client"

type SessionRow = {
  id: string
  event_id: string
  title: string
  room: string | null
  start_time: string
  end_time: string
}

export default function EditSessionPage() {
  const router = useRouter()
  const params = useParams<{ id: string; sessionId: string }>()
  const eventId = params?.id as string
  const sessionId = params?.sessionId as string

  const [title, setTitle] = useState("")
  const [room, setRoom] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
    return createSupabaseClient()
  }, [])

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false)
        setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
        return
      }
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("event_id", eventId)
        .single<SessionRow>()
      if (error || !data) {
        setError(error?.message || "Session not found.")
        setLoading(false)
        return
      }
      setTitle(data.title ?? "")
      setRoom(data.room ?? "")
      setStart(data.start_time ? new Date(data.start_time).toISOString().slice(0, 16) : "")
      setEnd(data.end_time ? new Date(data.end_time).toISOString().slice(0, 16) : "")
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, eventId, sessionId])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError(null)
    setMsg(null)
    const { error } = await supabase
      .from("sessions")
      .update({
        title,
        room,
        start_time: start ? new Date(start).toISOString() : null,
        end_time: end ? new Date(end).toISOString() : null,
      })
      .eq("id", sessionId)
      .eq("event_id", eventId)
    setSaving(false)
    if (error) setError(error.message)
    else {
      setMsg("Session updated.")
      router.push(`/organizer/events/${eventId}`)
    }
  }

  async function onDelete() {
    if (!supabase) return
    if (!confirm("Delete this session? This cannot be undone.")) return
    setSaving(true)
    setError(null)
    setMsg(null)
    const { error } = await supabase.from("sessions").delete().eq("id", sessionId).eq("event_id", eventId)
    setSaving(false)
    if (error) setError(error.message)
    else router.push(`/organizer/events/${eventId}`)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-nav text-2xl mb-4">Edit Session</h1>
        <p className="text-sm opacity-80">Loading…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-nav text-2xl mb-4">Edit Session</h1>
      {!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
        <div className="mb-4 rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          Supabase variables missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then refresh.
        </div>
      ) : null}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {msg && <p className="mb-3 text-sm text-green-700">{msg}</p>}
      <form onSubmit={onSave} className="space-y-4">
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
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onDelete}
            className="rounded border border-red-600 px-4 py-2 text-red-700"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
