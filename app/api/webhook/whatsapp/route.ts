import { createHmac, timingSafeEqual } from "crypto"

import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

function validateSignature(rawBody: string, signatureHeader: string | null, appSecret: string) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false
  }

  const signature = signatureHeader.substring("sha256=".length)
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex")

  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))
  } catch {
    return false
  }
}

function extractPhoneIds(entryPayload: unknown): string[] {
  if (!Array.isArray(entryPayload)) {
    return []
  }

  const phoneIds = new Set<string>()

  entryPayload.forEach((entry) => {
    const typedEntry = entry as Record<string, any>
    const changes = Array.isArray(typedEntry?.changes) ? typedEntry.changes : []

    changes.forEach((change) => {
      const value = (change as Record<string, any>)?.value ?? {}
      const metadata = value.metadata ?? {}
      const phoneId = metadata.phone_number_id ?? metadata.phone_number

      if (typeof phoneId === "string" && phoneId.trim().length > 0) {
        phoneIds.add(phoneId.trim())
      }

      const contacts = Array.isArray(value.contacts) ? value.contacts : []
      contacts.forEach((contact) => {
        const waId = (contact as Record<string, any>)?.wa_id

        if (typeof waId === "string" && waId.trim().length > 0) {
          phoneIds.add(waId.trim())
        }
      })
    })
  })

  return Array.from(phoneIds)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const challenge = searchParams.get("hub.challenge")
  const verifyToken = searchParams.get("hub.verify_token")
  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  if (!expectedToken) {
    return NextResponse.json({ error: "Webhook verify token is not configured" }, { status: 500 })
  }

  if (mode === "subscribe" && challenge && verifyToken === expectedToken) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }

  return NextResponse.json({ error: "Invalid verification request" }, { status: 403 })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!rawBody) {
    return NextResponse.json({ success: false, error: "Empty payload" }, { status: 400 })
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET
  const signatureHeader = request.headers.get("x-hub-signature-256")

  if (appSecret && !validateSignature(rawBody, signatureHeader, appSecret)) {
    console.warn("[whatsapp:webhook] Invalid signature, dropping payload")
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 })
  }

  let payload: any

  try {
    payload = JSON.parse(rawBody)
  } catch (error) {
    console.error("[whatsapp:webhook] Unable to parse payload", error)
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }

  const phoneIds = extractPhoneIds(payload?.entry)
  const supabase = createAdminClient()
  let storeSettingsByPhoneId = new Map<string, { store_id: string }>()

  if (phoneIds.length > 0) {
    const { data: storeSettings, error: lookupError } = await supabase
      .from("store_settings")
      .select("store_id, wa_phone_number_id")
      .in("wa_phone_number_id", phoneIds)

    if (lookupError) {
      console.error("[whatsapp:webhook] Error fetching store settings", lookupError)
    } else if (Array.isArray(storeSettings)) {
      storeSettingsByPhoneId = new Map(
        storeSettings
          .filter((setting) => typeof setting.wa_phone_number_id === "string")
          .map((setting) => [setting.wa_phone_number_id as string, { store_id: setting.store_id as string }]),
      )
    }
  }

  const events: Array<{
    entry_id?: string
    field?: string
    phone_number_id?: string
    store_id?: string | null
    payload: Record<string, unknown>
  }> = []

  if (Array.isArray(payload?.entry)) {
    payload.entry.forEach((entry: any) => {
      const entryId = entry?.id
      const changes = Array.isArray(entry?.changes) ? entry.changes : []

      changes.forEach((change: any) => {
        const value = change?.value ?? {}
        const metadata = value.metadata ?? {}
        const phoneId = metadata.phone_number_id ?? metadata.phone_number ?? value?.contacts?.[0]?.wa_id ?? null
        const trimmedPhoneId = typeof phoneId === "string" ? phoneId.trim() : null
        const resolvedStore = trimmedPhoneId ? storeSettingsByPhoneId.get(trimmedPhoneId)?.store_id ?? null : null

        events.push({
          entry_id: typeof entryId === "string" ? entryId : undefined,
          field: typeof change?.field === "string" ? change.field : undefined,
          phone_number_id: trimmedPhoneId ?? undefined,
          store_id: resolvedStore,
          payload: value as Record<string, unknown>,
        })
      })
    })
  }

  if (events.length > 0) {
    try {
      const insertPayload = events.map((event) => ({
        store_id: event.store_id ?? null,
        phone_number_id: event.phone_number_id ?? null,
        entry_id: event.entry_id ?? null,
        change_field: event.field ?? null,
        payload: event.payload,
      }))

      await supabase.from("whatsapp_webhook_events").insert(insertPayload)
    } catch (error) {
      console.error("[whatsapp:webhook] Unable to persist webhook events", error)
    }
  } else {
    console.warn("[whatsapp:webhook] Received payload without changes or entries")
  }

  return NextResponse.json({ success: true })
}
