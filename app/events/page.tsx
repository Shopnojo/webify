import Link from "next/link"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export default async function EventsPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } },
  )
  const { data: events } = await supabase
    .from("events")
    .select("id,title,venue,start_time,end_time")
    .order("start_time", { ascending: true })
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-4">
      <h1 className="font-nav text-2xl">Discover Events</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {(events || []).map((e) => (
          <Link key={e.id} href={`/event/${e.id}`} className="rounded border border-border p-4 hover:bg-muted/40">
            <div className="font-medium">{e.title}</div>
            <div className="text-sm opacity-80">{e.venue}</div>
            <div className="text-sm opacity-80">{new Date(e.start_time).toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
