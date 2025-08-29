"use client"

import { useEffect, useMemo, useState } from "react"
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

export default function ChatPanel({ eventId }: { eventId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const deviceId = useDeviceId()
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")

  const { data, mutate } = useSWR(["messages", eventId], async () => {
    const { data } = await supabase
      .from("messages")
      .select("id, author_name, content, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .limit(200)
    return data || []
  })

  useEffect(() => {
    const chan = supabase
      .channel(`realtime:messages:${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `event_id=eq.${eventId}` },
        async () => {
          mutate()
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(chan)
    }
  }, [eventId, supabase, mutate])

  async function sendMessage() {
    if (!message.trim()) return
    await supabase.from("messages").insert({
      event_id: eventId,
      author_id: deviceId,
      author_name: name || "Guest",
      content: message.trim(),
    })
    setMessage("")
    // optional: leaderboard
    await fetch("/api/engagement/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        actor_id: deviceId,
        actor_name: name || "Guest",
        delta: 1,
        reason: "chat",
      }),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border border-border px-3 py-2"
          placeholder="Your name (optional)"
        />
      </div>
      <div className="max-h-72 overflow-y-auto rounded border border-border p-3 text-sm">
        {(data || []).map((m: any) => (
          <div key={m.id} className="mb-2">
            <span className="font-medium">{m.author_name || "Guest"}:</span>{" "}
            <span className="opacity-90">{m.content}</span>
          </div>
        ))}
        {!data?.length && <div className="opacity-70">Be the first to say hello!</div>}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 rounded border border-border px-3 py-2"
          placeholder="Type a message"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="rounded bg-primary px-3 py-2 text-white">
          Send
        </button>
      </div>
    </div>
  )
}
