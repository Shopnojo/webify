"use client"

import { useEffect, useMemo } from "react"
import useSWR from "swr"
import { createClient } from "../../lib/supabase/client"

function useDeviceId() {
  return useMemo(() => {
    const key = "v0_device_id"
    let id = ""
    try {
      id = localStorage.getItem(key) || ""
      if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem(key, id)
      }
    } catch {}
    return id
  }, [])
}

export default function PollsPanel({ eventId }: { eventId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const deviceId = useDeviceId()

  const { data, mutate } = useSWR(["polls", eventId], async () => {
    const { data: polls } = await supabase
      .from("polls")
      .select("id, question, is_open, poll_options(id, text), poll_votes(count)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(1)
    const poll = polls?.[0]
    if (!poll) return null
    // compute counts per option
    const { data: votes } = await supabase.from("poll_votes").select("option_id").eq("poll_id", poll.id)
    const counts: Record<string, number> = {}
    for (const v of votes || []) counts[v.option_id] = (counts[v.option_id] || 0) + 1
    return { poll, counts }
  })

  useEffect(() => {
    const chan = supabase
      .channel(`realtime:polls:${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "polls", filter: `event_id=eq.${eventId}` }, () =>
        mutate(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, () => mutate())
      .subscribe()
    return () => {
      supabase.removeChannel(chan)
    }
  }, [eventId, supabase, mutate])

  async function vote(optionId: string, pollId: string) {
    await supabase.from("poll_votes").insert({ poll_id: pollId, option_id: optionId, voter_id: deviceId })
    await fetch("/api/engagement/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, actor_id: deviceId, delta: 1, reason: "poll-vote" }),
    })
    mutate()
  }

  if (!data?.poll) return <div className="opacity-70 text-sm">No active poll.</div>

  const { poll, counts } = data

  return (
    <div className="flex flex-col gap-3">
      <div className="font-medium">{poll.question}</div>
      <div className="flex flex-col gap-2">
        {poll.poll_options?.map((o: any) => (
          <button
            key={o.id}
            onClick={() => vote(o.id, poll.id)}
            className="flex items-center justify-between rounded border border-border px-3 py-2"
            disabled={!poll.is_open}
          >
            <span>{o.text}</span>
            <span className="text-xs opacity-80">{counts[o.id] || 0} votes</span>
          </button>
        ))}
      </div>
      {!poll.is_open && <div className="text-xs opacity-70">Poll closed</div>}
    </div>
  )
}
