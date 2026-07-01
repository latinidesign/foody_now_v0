import { Resend } from "resend"
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { registrationTemplate } from "@/lib/email/registration-template"

export const runtime = "nodejs"

type NotifyRegistrationBody = {
  firstName?: unknown
  lastName?: unknown
  email?: unknown
  utm?: unknown
}

type RegistrationUtm = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined
}

function parseUtm(value: unknown): RegistrationUtm {
  if (!value || typeof value !== "object") return {}
  const raw = value as Record<string, unknown>
  return {
    utm_source: asString(raw.utm_source),
    utm_medium: asString(raw.utm_medium),
    utm_campaign: asString(raw.utm_campaign),
    utm_content: asString(raw.utm_content),
    utm_term: asString(raw.utm_term),
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const adminClient = createAdminClient()
  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token)

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const notifyTo = process.env.NOTIFY_REGISTRATION_TO

  if (!apiKey || !notifyTo) {
    console.error(
      "[notify-registration] Missing RESEND_API_KEY or NOTIFY_REGISTRATION_TO env vars"
    )
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as NotifyRegistrationBody
  const firstName = asString(body.firstName) ?? ""
  const lastName = asString(body.lastName) ?? ""
  const email = asString(body.email) ?? user.email ?? ""
  const utm = parseUtm(body.utm)

  if (!email) {
    return NextResponse.json(
      { error: "Missing registration email" },
      { status: 400 }
    )
  }

  const resend = new Resend(apiKey)
  const recipients = notifyTo.split(",").map((e) => e.trim()).filter(Boolean)

  try {
    const { error: sendError } = await resend.emails.send({
      from: "FoodyNow <noreply@foodynow.com.ar>",
      to: recipients,
      subject: `Nuevo registro: ${firstName} ${lastName}`.trim(),
      html: registrationTemplate({ firstName, lastName, email, utm }),
    })

    if (sendError) {
      console.error("[notify-registration] Resend send error:", sendError)
      return NextResponse.json(
        { error: "Failed to send notification" },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error("[notify-registration] Failed to send email:", err)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
