"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient as createSupabaseClient } from "../../../lib/supabase/client"

export default function NewEventPage() {
  const [title, setTitle] = useState("")
  const [venue, setVenue] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [desc, setDesc] = useState("")
  const router = useRouter()
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return null
    return createSupabaseClient()
  }, [])

  async function createEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from("events")
      .insert({
        organizer_id: user.id,
        title,
        venue,
        start_time: start,
        end_time: end,
        description: desc,
      })
      .select("id")
      .single()
    if (!error && data?.id) router.push(`/organizer/events/${data.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-nav text-2xl mb-4">Create Event</h1>
      {!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
        <div className="mb-4 rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          Supabase variables missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then refresh.
        </div>
      ) : null}
      <form onSubmit={createEvent} className="space-y-4">
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
        <button className="rounded bg-primary px-4 py-2 text-white">Create</button>
      </form>
    </div>
  )
}
