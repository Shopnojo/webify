import Link from "next/link"

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between">
        <div className="font-nav text-xl">EventIQ</div>
        <nav className="font-nav flex items-center gap-6">
          <Link href="/events" className="hover:underline">
            Explore Events
          </Link>
          <Link href="/organizer" className="hover:underline">
            Organizer Dashboard
          </Link>
          <Link href="/auth/login" className="rounded bg-primary px-3 py-1.5 text-white">
            Login
          </Link>
        </nav>
      </header>
      <section className="mt-16 space-y-4">
        <h1 className="text-pretty text-3xl md:text-4xl font-medium">
          Create, Discover, and Experience Smarter Events
        </h1>
        <p className="max-w-2xl leading-relaxed">
          AI-powered scheduling, smart registration with QR e-tickets, real-time engagement, and actionable post-event
          insights.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/organizer/new" className="rounded bg-primary px-4 py-2 text-white">
            Create an Event
          </Link>
          <Link href="/events" className="rounded border border-border px-4 py-2">
            Get Recommendations
          </Link>
        </div>
      </section>
    </div>
  )
}
