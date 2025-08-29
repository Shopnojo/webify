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

export default function QnaPanel({ eventId }: { eventId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const deviceId = useDeviceId()
  const [name, setName] = useState("")
  const [question, setQuestion] = useState("")

  const { data, mutate } = useSWR(["questions", eventId], async () => {
    const { data } = await supabase
      .from("questions")
      .select("id, content, author_name, created_at, question_votes(count)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
    // normalize vote count
    const withVotes =
      data?.map((q: any) => ({
        ...q,
        votes: Array.isArray(q.question_votes) ? q.question_votes[0]?.count || 0 : 0,
      })) || []
    // sort by votes desc then recent
    withVotes.sort((a: any, b: any) => (b.votes || 0) - (a.votes || 0))
    return withVotes
  })

  useEffect(() => {
    const chan = supabase
      .channel(`realtime:questions:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions", filter: `event_id=eq.${eventId}` },
        () => mutate(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "question_votes" }, () => mutate())
      .subscribe()
    return () => {
      supabase.removeChannel(chan)
    }
  }, [eventId, supabase, mutate])

  async function ask() {
    if (!question.trim()) return
    await supabase.from("questions").insert({
      event_id: eventId,
      author_id: deviceId,
      author_name: name || "Guest",
      content: question.trim(),
    })
    setQuestion("")
    await fetch("/api/engagement/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        actor_id: deviceId,
        actor_name: name || "Guest",
        delta: 2,
        reason: "qna",
      }),
    })
  }

  async function upvote(id: string) {
    await supabase.from("question_votes").insert({ question_id: id, voter_id: deviceId })
    await fetch("/api/engagement/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        actor_id: deviceId,
        actor_name: name || "Guest",
        delta: 1,
        reason: "qna-vote",
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
      <div className="flex items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 rounded border border-border px-3 py-2"
          placeholder="Ask a question"
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button onClick={ask} className="rounded bg-primary px-3 py-2 text-white">
          Ask
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto rounded border border-border p-3 text-sm">
        {(data || []).map((q: any) => (
          <div key={q.id} className="mb-3">
            <div className="font-medium">{q.content}</div>
            <div className="flex items-center gap-3 text-xs opacity-80">
              <span>by {q.author_name || "Guest"}</span>
              <button onClick={() => upvote(q.id)} className="rounded border border-border px-2 py-1">
                ▲ {q.votes || 0}
              </button>
            </div>
          </div>
        ))}
        {!data?.length && <div className="opacity-70">No questions yet.</div>}
      </div>
    </div>
  )
}
