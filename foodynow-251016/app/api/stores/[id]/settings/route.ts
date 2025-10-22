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

    const updateData: any = {
      store_id: params.id,
      updated_at: new Date().toISOString(),
    }

    // Agregar campos de MercadoPago si están presentes
    if (settingsData.mercadopagoAccessToken !== undefined) {
      updateData.mercadopago_access_token = settingsData.mercadopagoAccessToken
    }
    if (settingsData.mercadopagoPublicKey !== undefined) {
      updateData.mercadopago_public_key = settingsData.mercadopagoPublicKey
    }

    // Agregar horarios de negocio si están presentes
    if (settingsData.business_hours !== undefined) {
      updateData.business_hours = settingsData.business_hours
    }

    const { data: settings, error } = await supabase
      .from("store_settings")
      .upsert(updateData, {
        onConflict: "store_id",
      })
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
