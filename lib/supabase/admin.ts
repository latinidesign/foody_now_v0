import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() solo puede ejecutarse en el servidor para proteger la service role."
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("[createAdminClient] NEXT_PUBLIC_SUPABASE_URL:", !!url)
  console.log("[createAdminClient] SUPABASE_SERVICE_ROLE_KEY length:", serviceKey ? serviceKey.length : 0)

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase admin environment variables. Please check your configuration.")
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
