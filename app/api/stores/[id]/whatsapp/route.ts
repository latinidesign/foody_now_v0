import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Log para depuración de parámetros
    console.log("PUT /stores/[id]/whatsapp", { paramsId: id, userId: user.id })

    const body = await request.json()
    const {
      whatsapp_number,
      whatsapp_notifications,
      whatsapp_message,
      wa_phone_number_id,
      wa_business_account_id,
      wa_access_token,
      wa_metadata,
      order_status_messages,
    } = body

    // Verificar que la tienda pertenece al usuario
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    // Si se envía order_status_messages, hacer merge con los existentes
    let mergedMessages: Record<string, string> | null = null
    if (order_status_messages != null && typeof order_status_messages === "object") {
      const { data: existing } = await supabase
        .from("store_settings")
        .select("order_status_messages")
        .eq("store_id", id)
        .maybeSingle()

      const existingMessages =
        existing?.order_status_messages && typeof existing.order_status_messages === "object"
          ? (existing.order_status_messages as Record<string, string>)
          : {}

      mergedMessages = { ...existingMessages }

      for (const [key, val] of Object.entries(order_status_messages)) {
        if (val === null) {
          delete mergedMessages[key]
        } else {
          mergedMessages[key] = val as string
        }
      }

      if (Object.keys(mergedMessages).length === 0) {
        mergedMessages = null
      }
    } else if (order_status_messages === null) {
      mergedMessages = null
    }

    const { data, error } = await supabase
      .from("store_settings")
      .upsert(
        {
          store_id: id,
          whatsapp_number,
          whatsapp_notifications_enabled: whatsapp_notifications,
          whatsapp_message,
          wa_phone_number_id,
          wa_business_account_id,
          wa_access_token,
          ...(wa_metadata !== undefined ? { wa_metadata } : {}),
          ...(mergedMessages !== null ? { order_status_messages: mergedMessages } : {}),
          ...(order_status_messages !== undefined && mergedMessages === null ? { order_status_messages: null } : {}),
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
