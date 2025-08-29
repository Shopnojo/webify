// add a safe server-side Supabase client helper with cookie support
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createServerClientSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null

  const cookieStore = await cookies()

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Component context without mutable cookies; ignore.
        }
      },
    },
  })
}
