import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import QRCode from "qrcode"
import PrintButton from "../../../components/print-button"

export default async function TicketPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } },
  )

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("qr_payload, qr_signature, registration:registrations(event:events(title,venue,start_time))")
    .eq("registration_id", params.id)
    .single()

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-sm px-6 py-10 space-y-4 text-center">
        <h1 className="font-nav text-2xl">Ticket not found</h1>
        <p className="text-sm opacity-80">We couldn't find a ticket for this registration.</p>
      </div>
    )
  }

  let parsed: any = {}
  try {
    parsed = typeof ticket.qr_payload === "string" ? JSON.parse(ticket.qr_payload) : (ticket.qr_payload ?? {})
  } catch {
    parsed = {}
  }
  const payload = { ...parsed, signature: ticket.qr_signature }
  const dataUrl = await QRCode.toDataURL(JSON.stringify(payload))

  return (
    <div className="mx-auto max-w-sm px-6 py-10 space-y-4 text-center">
      <h1 className="font-nav text-2xl">Your E-Ticket</h1>
      <img
        src={dataUrl || "/placeholder.svg?height=192&width=192&query=qr%20code"}
        alt="QR code"
        className="mx-auto h-48 w-48"
      />
      <div className="rounded border border-border p-3 text-sm">
        <div className="font-medium">{ticket.registration?.event?.title}</div>
        <div className="opacity-80">{ticket.registration?.event?.venue}</div>
        <div className="opacity-80">
          {ticket.registration?.event?.start_time
            ? new Date(ticket.registration.event.start_time).toLocaleString()
            : ""}
        </div>
      </div>
      <PrintButton className="rounded bg-primary px-4 py-2 text-white">Download / Print</PrintButton>
    </div>
  )
}
