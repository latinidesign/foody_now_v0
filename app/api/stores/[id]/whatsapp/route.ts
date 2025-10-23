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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)

    // Verificar que la tienda pertenece al usuario usando ID o slug
    const storesQuery = supabase.from("stores").select("id").eq("owner_id", user.id)
    const { data: store } = isUuid
      ? await storesQuery.eq("id", params.id).single()
      : await storesQuery.eq("slug", params.id).single()

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("store_settings")
      .upsert(
        {
          store_id: store.id,
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
