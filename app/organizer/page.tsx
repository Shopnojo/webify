import Link from "next/link"
import { createServerClientSafe } from "../../lib/supabase/server"

export default async function OrganizerDashboard() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-nav text-2xl">Please log in</h1>
        <p className="mt-2">
          <Link className="underline" href="/auth/login">
            Go to login
          </Link>
        </p>
      </div>
    )
  }

  const { data: events } = await supabase
    .from("events")
    .select("id,title,venue,start_time,end_time,attendee_count:registrations(count)")
    .eq("organizer_id", user.id)
    .order("start_time", { ascending: true })

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-nav text-2xl">Organizer Dashboard</h1>
        <Link href="/organizer/new" className="rounded bg-primary px-3 py-1.5 text-white">
          New Event
        </Link>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Your Events</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(events || []).map((e) => (
            <Link
              key={e.id}
              href={`/organizer/events/${e.id}`}
              className="rounded border border-border p-4 hover:bg-muted/40"
            >
              <div className="font-medium">{e.title}</div>
              <div className="text-sm opacity-80">{e.venue}</div>
              <div className="text-sm opacity-80">
                {new Date(e.start_time).toLocaleString()} - {new Date(e.end_time).toLocaleString()}
              </div>
            </Link>
          ))}
          {!events?.length && <p className="text-sm opacity-80">No events yet. Create your first one.</p>}
        </div>
      </section>
    </div>
  )
}
