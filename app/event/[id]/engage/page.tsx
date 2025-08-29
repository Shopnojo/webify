"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

type Message = { id: string; content: string; author: string; created_at: string }

export default function EngagePage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<"chat" | "qa" | "polls" | "leaderboard">("chat")
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-nav text-2xl mb-4">Engagement Hub</h1>
      <div className="flex gap-2 mb-4">
        {["chat", "qa", "polls", "leaderboard"].map((t) => (
          <button
            key={t}
            className={`rounded px-3 py-1.5 border ${tab === t ? "bg-primary text-white border-primary" : "border-border"}`}
            onClick={() => setTab(t as any)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      {tab === "chat" && <LiveChat eventId={params.id} />}
      {tab === "qa" && <LiveQA eventId={params.id} />}
      {tab === "polls" && <Polls eventId={params.id} />}
      {tab === "leaderboard" && <Leaderboard eventId={params.id} />}
    </div>
  )
}

function LiveChat({ eventId }: { eventId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${eventId}`)
      .on("broadcast", { event: "message" }, (payload) => setMessages((m) => [...m, payload.payload as any]))
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  function send() {
    if (!input.trim()) return
    const msg = { id: crypto.randomUUID(), content: input, author: "anon", created_at: new Date().toISOString() }
    supabase.channel(`chat:${eventId}`).send({ type: "broadcast", event: "message", payload: msg })
    setInput("")
  }

  return (
    <div className="space-y-3">
      <div className="rounded border border-border p-3 h-64 overflow-auto space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium">{m.author}:</span> {m.content}
          </div>
        ))}
        {!messages.length && <p className="text-sm opacity-80">No messages yet. Start the conversation!</p>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-border px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
        />
        <button onClick={send} className="rounded bg-primary px-3 py-2 text-white">
          Send
        </button>
      </div>
    </div>
  )
}

function LiveQA({ eventId }: { eventId: string }) {
  const [questions, setQuestions] = useState<Message[]>([])
  const [q, setQ] = useState("")
  useEffect(() => {
    const channel = supabase
      .channel(`qa:${eventId}`)
      .on("broadcast", { event: "question" }, (p) => setQuestions((x) => [...x, p.payload as any]))
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])
  function ask() {
    if (!q.trim()) return
    const m = { id: crypto.randomUUID(), content: q, author: "anon", created_at: new Date().toISOString() }
    supabase.channel(`qa:${eventId}`).send({ type: "broadcast", event: "question", payload: m })
    setQ("")
  }
  return (
    <div className="space-y-3">
      <div className="rounded border border-border p-3 space-y-2">
        {questions.map((m) => (
          <div key={m.id} className="text-sm">
            {m.content}
          </div>
        ))}
        {!questions.length && <p className="text-sm opacity-80">No questions yet.</p>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-border px-3 py-2"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask a question..."
        />
        <button onClick={ask} className="rounded bg-primary px-3 py-2 text-white">
          Ask
        </button>
      </div>
    </div>
  )
}

function Polls({ eventId }: { eventId: string }) {
  const [poll, setPoll] = useState<{ question: string; options: string[] } | null>(null)
  const [sel, setSel] = useState<number | null>(null)
  useEffect(() => {
    const channel = supabase
      .channel(`polls:${eventId}`)
      .on("broadcast", { event: "poll" }, (p) => setPoll(p.payload as any))
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])
  function vote() {
    if (sel == null) return
    supabase.channel(`polls:${eventId}`).send({ type: "broadcast", event: "vote", payload: { option: sel } })
  }
  return (
    <div className="space-y-3">
      {poll ? (
        <>
          <div className="font-medium">{poll.question}</div>
          <div className="space-y-2">
            {poll.options.map((o, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input type="radio" name="opt" onChange={() => setSel(i)} /> {o}
              </label>
            ))}
          </div>
          <button onClick={vote} className="rounded bg-primary px-3 py-2 text-white">
            Vote
          </button>
        </>
      ) : (
        <p className="text-sm opacity-80">No active poll.</p>
      )}
    </div>
  )
}

function Leaderboard({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<{ name: string; points: number }[]>([])
  useEffect(() => {
    const channel = supabase
      .channel(`leaderboard:${eventId}`)
      .on("broadcast", { event: "update" }, (p) => setRows(p.payload.rows))
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])
  return (
    <div className="rounded border border-border p-3 space-y-2">
      {rows.length ? (
        rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span>
              {i + 1}. {r.name}
            </span>
            <span className="font-medium">{r.points}</span>
          </div>
        ))
      ) : (
        <p className="text-sm opacity-80">Leaderboard updates will appear here.</p>
      )}
    </div>
  )
}
