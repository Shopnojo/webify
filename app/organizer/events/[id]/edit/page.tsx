"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient as createSupabaseClient } from "../../../../../../lib/supabase/client"

type EventRow = {
  id: string
  organizer_id: string
  title: string
  venue: string
  start_time: string
  end_time: string
  description: string | null
}

export default function EditEventPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [venue, setVenue] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [desc, setDesc] = useState("")

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return null
    return createSupabaseClient()
  }, [])

  // Load event and verify ownership
  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false)
        setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
        return
      }
      const id = params?.id as string
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be signed in to edit this event.")
        setLoading(false)
        return
      }
      const { data: event, error } = await supabase.from("events").select("*").eq("id", id).single<EventRow>()
      if (error || !event) {
        setError(error?.message || "Event not found.")
        setLoading(false)
        return
      }
      if (event.organizer_id !== user.id) {
        setError("You are not authorized to edit this event.")
        setLoading(false)
        return
      }
      setTitle(event.title ?? "")
      setVenue(event.venue ?? "")
      // Normalize to local datetime-local input (expects "YYYY-MM-DDTHH:mm")
      setStart(event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : "")
      setEnd(event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : "")
      setDesc(event.description ?? "")
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, params?.id])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError(null)
    setMsg(null)
    const id = params?.id as string
    const { error } = await supabase
      .from("events")
      .update({
        title,
        venue,
        start_time: start ? new Date(start).toISOString() : null,
        end_time: end ? new Date(end).toISOString() : null,
        description: desc,
      })
      .eq("id", id)
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setMsg("Event updated.")
      router.push(`/organizer/events/${id}`)
    }
  }

  async function onDelete() {
    if (!supabase) return
    const id = params?.id as string
    if (!confirm("Delete this event? This cannot be undone.")) return
    setSaving(true)
    setError(null)
    setMsg(null)
    const { error } = await supabase.from("events").delete().eq("id", id)
    setSaving(false)
    if (error) setError(error.message)
    else router.push("/organizer")
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-nav text-2xl mb-4">Edit Event</h1>
        <p className="text-sm opacity-80">Loading…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-nav text-2xl mb-4">Edit Event</h1>
      {!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
        <div className="mb-4 rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          Supabase variables missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then refresh.
        </div>
      ) : null}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {msg && <p className="mb-3 text-sm text-green-700">{msg}</p>}

      <form onSubmit={onSave} className="space-y-4">
        <input
          className="w-full rounded border border-border px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full rounded border border-border px-3 py-2"
          placeholder="Venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded border border-border px-3 py-2"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <input
            className="rounded border border-border px-3 py-2"
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <textarea
          className="w-full rounded border border-border px-3 py-2"
          rows={4}
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
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
