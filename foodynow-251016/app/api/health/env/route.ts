import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    runtime: process.env.NEXT_RUNTIME || "node",
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // No devolvemos valores, solo booleans
  })
}
