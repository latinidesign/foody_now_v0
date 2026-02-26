import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("checkout_sessions")
    .select("id, payment_status, order_id")
    .eq("id", sessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}