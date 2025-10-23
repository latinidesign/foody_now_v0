import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { z } from "zod"

const envSchema = z.object({
	NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
	NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

type ServerSupabaseClient = SupabaseClient<unknown, "public", unknown>

const warn = (message: string, error?: unknown) => {
	if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
		return
	}
	if (error) {
		console.warn(message, error)
		return
	}
	console.warn(message)
}

export async function createClient(): Promise<ServerSupabaseClient | null> {
	const cookieStore = await cookies()
	const parsedEnv = envSchema.safeParse({
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	})

	if (!parsedEnv.success) {
		warn("[Supabase] Missing or invalid environment variables for server client.")
		return null
	}

	try {
		return createServerClient<unknown, "public", unknown>(
			parsedEnv.data.NEXT_PUBLIC_SUPABASE_URL,
			parsedEnv.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll()
					},
					setAll(cookiesToSet) {
						try {
							cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
						} catch (error) {
							warn("[Supabase] Failed to persist cookies from server component context.", error)
						}
					},
				},
			},
		)
	} catch (error) {
		warn("[Supabase] Failed to create server client instance.", error)
		return null
	}
}
