import crypto from "crypto"

type Payload = Record<string, unknown>

function stableStringify(obj: Payload) {
  const keys = Object.keys(obj).sort()
  const ordered: Payload = {}
  for (const k of keys) ordered[k] = obj[k]
  return JSON.stringify(ordered)
}

export function signPayload(payload: Payload, secret = process.env.QR_SIGNING_SECRET || "") {
  const body = stableStringify(payload)
  return crypto.createHmac("sha256", secret).update(body).digest("hex")
}

export function verifySignature(payload: Payload, signature: string, secret = process.env.QR_SIGNING_SECRET || "") {
  if (!secret) return false
  try {
    const expected = signPayload(payload, secret)
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export function encodeToken(payload: Payload, signature: string) {
  const json = JSON.stringify({ p: payload, s: signature })
  return Buffer.from(json, "utf8").toString("base64url")
}

export function decodeToken(token: string): { payload: Payload; signature: string } | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8")
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== "object" || !parsed.p || !parsed.s) return null
    return { payload: parsed.p as Payload, signature: String(parsed.s) }
  } catch {
    return null
  }
}
