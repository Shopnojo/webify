export async function track(event: string, payload?: any) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload, ts: Date.now() }),
      keepalive: true,
    })
  } catch {}
}
