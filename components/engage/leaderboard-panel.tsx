"use client"

import { useEffect, useMemo } from "react"
import useSWR from "swr"
import { createClient } from "../../lib/supabase/client"

export default function LeaderboardPanel({ eventId }: { eventId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const { data, mutate } = useSWR(["leaderboard", eventId], async () => {
    // aggregate points by actor
    const { data: events } = await supabase
      .from("leaderboard_events")
      .select("actor_id, actor_name, delta")
      .eq("event_id", eventId)

    const map = new Map<string, { name: string; points: number }>()
    for (const e of events || []) {
      const cur = map.get(e.actor_id) || { name: e.actor_name || "Guest", points: 0 }
      cur.points += e.delta || 0
      cur.name = e.actor_name || cur.name
      map.set(e.actor_id, cur)
    }
    const list = Array.from(map.entries()).map(([id, v]) => ({ id, ...v }))
    list.sort((a, b) => b.points - a.points)
    return list.slice(0, 10)
  })

  useEffect(() => {
    const chan = supabase
      .channel(`realtime:leaderboard:${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leaderboard_events", filter: `event_id=eq.${eventId}` },
        () => mutate(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(chan)
    }
  }, [eventId, supabase, mutate])

  return (
    <div className="flex flex-col gap-2">
      <ol className="space-y-2">
        {(data || []).map((u: any, idx: number) => (
          <li key={u.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
            <span className="opacity-70">#{idx + 1}</span>
            <span className="flex-1 px-3">{u.name}</span>
            <span className="font-medium">{u.points}</span>
          </li>
        ))}
      </ol>
      {!data?.length && <div className="opacity-70 text-sm">No points yet.</div>}
    </div>
  )
}
