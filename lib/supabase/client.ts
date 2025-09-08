import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If variables are not available, create a mock client for development
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Supabase environment variables not found, using mock client")

    // Return a mock client that prevents crashes
    return {
      auth: {
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: { message: "Supabase not configured" },
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: { message: "Supabase not configured" },
        }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({
          data: { user: null },
          error: { message: "Supabase not configured" },
        }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: "Supabase not configured" } }),
        update: () => ({ data: null, error: { message: "Supabase not configured" } }),
        delete: () => ({ data: null, error: { message: "Supabase not configured" } }),
      }),
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
