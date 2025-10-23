import { NextResponse } from "next/server"

export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json({
    status: "ok",
    environment: envCheck,
    supabaseConfigured: envCheck.NEXT_PUBLIC_SUPABASE_URL && envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}
