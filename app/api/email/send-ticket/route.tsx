import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { to, name, ticketUrl, payload, signature } = await req.json()
  if (!process.env.RESEND_API_KEY) {
    // gracefully degrade if not configured
    return NextResponse.json({ ok: true, note: "Email provider not configured" })
  }
  const body = {
    from: "tickets@eventiq.example",
    to,
    subject: "Your e-ticket and QR code",
    html: `
      <p>Hi ${name || ""},</p>
      <p>Thanks for registering. Your e-ticket is available here:</p>
      <p><a href="${ticketUrl}">${ticketUrl}</a></p>
      <p>Your QR will be scanned at the entrance.</p>
      <p>Have a great event!</p>
    `,
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) return NextResponse.json({ error: "Email failed" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
