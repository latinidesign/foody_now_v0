import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Log para depuración de parámetros
    console.log("PUT /stores/[id]/whatsapp", { paramsId: params.id, userId: user.id })

    const body = await request.json()
    const {
      whatsapp_number,
      whatsapp_notifications,
      whatsapp_message,
      wa_phone_number_id,
      wa_business_account_id,
      wa_access_token,
      wa_metadata,
    } = body

    // Verificar que la tienda pertenece al usuario
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("store_settings")
      .upsert(
        {
          store_id: params.id,
          whatsapp_number,
          whatsapp_notifications_enabled: whatsapp_notifications,
          whatsapp_message,
          wa_phone_number_id,
          wa_business_account_id,
          wa_access_token,
          ...(wa_metadata !== undefined ? { wa_metadata } : {}),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "store_id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Error updating WhatsApp settings:", error)
      return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in WhatsApp settings API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
