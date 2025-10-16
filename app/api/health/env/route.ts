import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    runtime: process.env.NEXT_RUNTIME || "node",
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    whatsapp_webhook_verify_token: !!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    whatsapp_app_secret: !!process.env.WHATSAPP_APP_SECRET,
    // No devolvemos valores, solo booleans
  })
}
