"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { createClient as createSupabaseClient } from "../../../lib/supabase/client"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orgName, setOrgName] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return null
    return createSupabaseClient()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMsg(null)

    if (!supabase) {
      setLoading(false)
      setError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings.",
      )
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/organizer`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    const { error: insertErr } = await supabase.from("organizers").insert({ id: data.user?.id, name: orgName })
    setLoading(false)
    if (insertErr) setError(insertErr.message)
    else setMsg("Check your email to confirm your account.")
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-12">
      <h1 className="font-nav text-2xl mb-4">Create Organizer Account</h1>
      {!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
        <div className="mb-4 rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          Supabase variables missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then refresh.
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full rounded border border-border px-3 py-2"
          placeholder="Organization Name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
        <input
          className="w-full rounded border border-border px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded border border-border px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {msg && <p className="text-green-700 text-sm">{msg}</p>}
        <button disabled={loading} className="w-full rounded bg-primary px-3 py-2 text-white">
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  )
}
