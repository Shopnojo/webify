import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function EventPublic({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } },
  )
  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).single()
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("event_id", params.id)
    .order("start_time", { ascending: true })

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-nav text-2xl">{event?.title}</h1>
          <p className="text-sm opacity-80">
            {event?.venue} · {new Date(event?.start_time).toLocaleString()} –{" "}
            {new Date(event?.end_time).toLocaleString()}
          </p>
        </div>
        <Link href={`/event/${params.id}/engage`} className="rounded border border-border px-3 py-1.5">
          Engage
        </Link>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">About</h2>
        <p className="leading-relaxed">{event?.description || "Join us for an outstanding event."}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Schedule</h2>
        <div className="space-y-2">
          {(sessions || []).map((s) => (
            <div key={s.id} className="rounded border border-border p-3">
              <div className="font-medium">{s.title}</div>
              <div className="text-sm opacity-80">
                {new Date(s.start_time).toLocaleTimeString()} – {new Date(s.end_time).toLocaleTimeString()} · {s.room}
              </div>
            </div>
          ))}
          {!sessions?.length && <p className="text-sm opacity-80">Schedule coming soon.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Register</h2>
        <RegistrationForm eventId={params.id} />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Questions?</h2>
        <Link href={`/event/${params.id}/assistant`} className="rounded bg-primary px-4 py-2 text-white">
          Ask the AI Assistant
        </Link>
      </section>
    </div>
  )
}

function RegistrationForm({ eventId }: { eventId: string }) {
  async function action(formData: FormData) {
    "use server"
    const email = String(formData.get("email") || "")
    const name = String(formData.get("name") || "")
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, email, name }),
    })
    if (!res.ok) {
      throw new Error("Registration failed")
    }
    const json = (await res.json()) as { registration_id?: string }
    if (json?.registration_id) {
      redirect(`/ticket/${json.registration_id}`)
    }
    throw new Error("Registration incomplete")
  }
  return (
    <form action={action} className="space-y-3">
      <input name="name" required className="w-full rounded border border-border px-3 py-2" placeholder="Full name" />
      <input
        name="email"
        required
        className="w-full rounded border border-border px-3 py-2"
        placeholder="Email"
        type="email"
      />
      <button className="rounded bg-primary px-4 py-2 text-white">Register</button>
    </form>
  )
}
