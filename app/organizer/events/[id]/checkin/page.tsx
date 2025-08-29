"use client"

import dynamic from "next/dynamic"
import { useState } from "react"

const QrReader = dynamic(() => import("react-qr-reader").then((m) => m.QrReader as any), { ssr: false })

export default function CheckInPage({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onScan(data: string | null) {
    if (!data) return
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data, // QR payload is already JSON string
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Invalid QR")
      setResult(`Checked in: ${json.attendee_email || json.attendee_id}`)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-4">
      <h1 className="font-nav text-2xl">Check-In Scanner</h1>
      <div className="rounded border border-border p-3">
        <QrReader
          onResult={(res: any, err: any) => {
            if (!!res) onScan(res.getText())
            if (!!err) {
              /* ignore continuous errors */
            }
          }}
          constraints={{ facingMode: "environment" }}
          containerStyle={{ width: "100%" }}
        />
      </div>
      {result && <div className="rounded bg-green-50 border border-green-300 px-3 py-2 text-sm">{result}</div>}
      {error && <div className="rounded bg-red-50 border border-red-300 px-3 py-2 text-sm text-red-700">{error}</div>}
    </div>
  )
}
