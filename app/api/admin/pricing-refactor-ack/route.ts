import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    if (body?.storeId && body.storeId !== store.id) {
      return NextResponse.json({ error: "Tienda invalida" }, { status: 403 })
    }

    const now = new Date().toISOString()

    const { error } = await supabase
      .from("store_settings")
      .upsert(
        {
          store_id: store.id,
          pricing_refactor_acknowledged_at: now,
          updated_at: now,
        },
        { onConflict: "store_id" },
      )

    if (error) {
      console.error("[pricing-refactor-ack] update error", error)
      return NextResponse.json({ error: "Error al confirmar" }, { status: 500 })
    }

    return NextResponse.json({ acknowledgedAt: now })
  } catch (error) {
    console.error("[pricing-refactor-ack] api error", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
