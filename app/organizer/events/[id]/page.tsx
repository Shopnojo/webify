import Link from "next/link"
import { createServerClientSafe } from "../../../../lib/supabase/server"

export default async function EventDetail({ params }: { params: { id: string } }) {
  const supabase = await createServerClientSafe()
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-nav text-2xl">Configuration required</h1>
        <p className="mt-2 text-sm opacity-80">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings, then refresh.
        </p>
      </div>
    )
  }

  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).single()
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("event_id", params.id)
    .order("start_time", { ascending: true })
  const { data: regs } = await supabase.from("registrations").select("id").eq("event_id", params.id)

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-nav text-2xl">{event?.title}</h1>
          <p className="text-sm opacity-80">
            {event?.venue} · {new Date(event?.start_time).toLocaleString()} –{" "}
            {new Date(event?.end_time).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded border border-border px-3 py-1.5" href={`/event/${params.id}`}>
            Public Page
          </Link>
          <Link className="rounded bg-primary px-3 py-1.5 text-white" href={`/organizer/events/${params.id}/checkin`}>
            Open Check-In
          </Link>
          <Link className="rounded border border-border px-3 py-1.5" href={`/organizer/events/${params.id}/edit`}>
            Edit
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Sessions</h2>
          <div className="flex items-center gap-2">
            <Link href={`/organizer/events/${params.id}/schedule`} className="rounded border border-border px-3 py-1.5">
              AI Schedule Assistant
            </Link>
            <Link
              href={`/organizer/events/${params.id}/sessions/new`}
              className="rounded bg-primary px-3 py-1.5 text-white"
            >
              Add Session
            </Link>
          </div>
        </div>
        <div className="space-y-2">
          {(sessions || []).map((s) => (
            <div key={s.id} className="rounded border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm opacity-80">
                    {new Date(s.start_time).toLocaleTimeString()} – {new Date(s.end_time).toLocaleTimeString()}
                  </div>
                  <div className="text-sm opacity-80">Room: {s.room}</div>
                </div>
                <Link
                  href={`/organizer/events/${params.id}/sessions/${s.id}/edit`}
                  className="rounded border border-border px-3 py-1.5 text-sm"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {!sessions?.length && (
            <p className="text-sm opacity-80">No sessions yet. Use AI assistant to generate a balanced schedule.</p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Engagement Hub</h2>
        <p className="text-sm opacity-80">Live Chat, Q&A, Polls, and Leaderboard</p>
        <Link href={`/event/${params.id}/engage`} className="inline-block rounded bg-primary px-4 py-2 text-white">
          Open Engagement Hub
        </Link>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Attendees</h2>
        <p className="text-sm opacity-80">Total registrations: {regs?.length || 0}</p>
      </section>
    </div>
  )
}
