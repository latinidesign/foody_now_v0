import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const settingsData = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    const { data: settings, error } = await supabase
      .from("store_settings")
      .upsert(
        {
          store_id: params.id,
          mercadopago_access_token: settingsData.mercadopagoAccessToken,
          mercadopago_public_key: settingsData.mercadopagoPublicKey,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "store_id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Settings update error:", error)
      return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
