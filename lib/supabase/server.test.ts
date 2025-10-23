import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { cookieStoreMock, cookiesMock } = vi.hoisted(() => {
	const cookieStore = {
		getAll: vi.fn<[], unknown[]>(() => []),
		set: vi.fn<[string, string, unknown?], void>(),
	}

	return {
		cookieStoreMock: cookieStore,
		cookiesMock: vi.fn<[], Promise<typeof cookieStore>>(async () => cookieStore),
	}
})

const createServerClientMock = vi.hoisted(() =>
	vi.fn<
		[
			string,
			string,
			{
				cookies: {
					getAll: () => unknown[]
					setAll: (cookiesToSet: Array<{ name: string; value: string; options?: unknown }>) => void
				}
			}
		],
		unknown
	>()
)

vi.mock("next/headers", () => ({
	cookies: cookiesMock,
}))

vi.mock("@supabase/ssr", () => ({
	createServerClient: (...args: Parameters<typeof createServerClientMock>) => createServerClientMock(...args),
}))

import { createClient } from "./server"

describe("createClient", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		cookieStoreMock.getAll.mockReturnValue([])
	})

	afterEach(() => {
		delete process.env.NEXT_PUBLIC_SUPABASE_URL
		delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	})

	it("returns null when supabase env vars are missing", async () => {
		const client = await createClient()
		expect(client).toBeNull()
		expect(createServerClientMock).not.toHaveBeenCalled()
	})

	it("returns supabase client when env vars are valid", async () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
		const fakeClient: Record<string, unknown> = { from: vi.fn<[], unknown>() }
		createServerClientMock.mockReturnValue(fakeClient)

		const client = await createClient()

		expect(createServerClientMock).toHaveBeenCalledTimes(1)
		expect(client).toBe(fakeClient)
	})

	it("returns null if createServerClient throws", async () => {
		process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key"
		createServerClientMock.mockImplementation(() => {
			throw new Error("boom")
		})

		const client = await createClient()

		expect(client).toBeNull()
	})
})
