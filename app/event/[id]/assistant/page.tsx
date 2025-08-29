"use client"

import { useState } from "react"

type Msg = { role: "user" | "assistant"; content: string }

export default function AssistantPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Ask me anything about this event: sessions, rooms, registration, and more." },
  ])
  const [input, setInput] = useState("")

  async function send() {
    if (!input.trim()) return
    const userMsg: Msg = { role: "user", content: input }
    setMessages((m) => [...m, userMsg])
    setInput("")
    const res = await fetch(`/api/ai/faq?eventId=${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
    })
    const data = await res.json()
    setMessages((m) => [...m, { role: "assistant", content: data.text }])
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-4">
      <h1 className="font-nav text-2xl">Event Assistant</h1>
      <div className="rounded border border-border p-3 h-80 overflow-auto space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === "assistant" ? "" : "text-right"}`}>
            <span className={m.role === "assistant" ? "" : "inline-block bg-primary text-white rounded px-2 py-1"}>
              {m.content}
            </span>
            {m.role === "assistant" && <span>{m.content}</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-border px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Where is Session A?"
        />
        <button onClick={send} className="rounded bg-primary px-3 py-2 text-white">
          Send
        </button>
      </div>
    </div>
  )
}
