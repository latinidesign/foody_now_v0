import { createClient } from "@/lib/supabase/server"
import { whatsappService, type WhatsAppMessageStrategy } from "@/lib/whatsapp/client"
import { type NextRequest, NextResponse } from "next/server"

const normalizeComponents = (value: unknown): Array<Record<string, unknown>> | undefined => {
  if (Array.isArray(value)) {
    return value as Array<Record<string, unknown>>
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : undefined
    } catch (error) {
      console.warn("[v0] Unable to parse WhatsApp template components:", error)
    }
  }

  return undefined
}

const resolveStrategy = (value: unknown): WhatsAppMessageStrategy | undefined => {
  if (!value || typeof value !== "object") {
    return undefined
  }

  const strategy = value as Record<string, unknown>
  const type = strategy.type

  if (type === "template") {
    const name = typeof strategy.name === "string" ? strategy.name : undefined
    const language = typeof strategy.languageCode === "string" ? strategy.languageCode : "es"
    const components = normalizeComponents(strategy.components)

    if (name) {
      return {
        type: "template",
        name,
        languageCode: language,
        ...(components ? { components } : {}),
      }
    }
  }

  if (type === "text") {
    return { type: "text" }
  }

  return undefined
}

const sanitizePhoneNumber = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined
  }

  const cleaned = value.replace(/[\s-()]/g, "").trim()
  return cleaned.length > 0 ? cleaned : undefined
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Esperar params si es promesa
    const resolvedParams = await (context.params as Promise<{ id: string }> | { id: string })
    const storeId = resolvedParams.id
    console.log("POST /stores/[id]/whatsapp/test", { storeId, userId: user.id })

    const body = await request
      .json()
      .catch(() => ({}))

    const requestedNumber = sanitizePhoneNumber(typeof body?.to === "string" ? body.to : undefined)
    const customMessage = typeof body?.message === "string" ? body.message.trim() : undefined
    const strategy = resolveStrategy(body?.strategy)

    const {
      data: store,
      error: storeError,
    } = await supabase
      .from("stores")
      .select("id, name, phone, whatsapp_phone")
      .eq("id", storeId)
      .eq("owner_id", user.id)
      .maybeSingle()

    if (storeError) {
      console.error("[whatsapp:test] Error fetching store", storeError)
      return NextResponse.json({ error: "No se pudo obtener la tienda :(" }, { status: 500 })
    }

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada =(" }, { status: 404 })
    }

    const {
      data: storeSettings,
      error: storeSettingsError,
    } = await supabase
      .from("store_settings")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle()

    if (storeSettingsError && storeSettingsError.code !== "PGRST116") {
      console.error("[whatsapp:test] Error fetching store settings", storeSettingsError)
      return NextResponse.json(
        { error: "No se pudo obtener la configuración de WhatsApp" },
        { status: 500 },
      )
    }

    const targetPhone =
      requestedNumber && requestedNumber.length > 0
        ? requestedNumber
        : sanitizePhoneNumber(storeSettings?.whatsapp_number as string | undefined) ??
          sanitizePhoneNumber(store?.whatsapp_phone as string | undefined) ??
          sanitizePhoneNumber(store?.phone as string | undefined)

    if (!targetPhone) {
      return NextResponse.json(
        { error: "No hay un número de WhatsApp configurado para enviar el mensaje" },
        { status: 400 },
      )
    }

    const message =
      customMessage && customMessage.length > 0
        ? customMessage
        : `Hola! Este es un mensaje de prueba enviado desde FoodyNow para verificar la integración de WhatsApp de ${store.name}.`

    // Use global WhatsApp service without per-tenant credentials
    const result = await whatsappService.sendTextMessage(targetPhone, message, {
      ...(strategy ? { strategy } : {}),
    })

    console.log("[whatsapp:test] Result:", result)

    // Verificar si tenemos credenciales de WhatsApp configuradas
    const hasWhatsAppCredentials = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID && 
                                   process.env.WHATSAPP_BUSINESS_ACCESS_TOKEN

    // FORZAR MODO LINK para mayor compatibilidad
    // En lugar de confiar en la API que puede tener restricciones,
    // siempre generar link de WhatsApp que es 100% confiable
    
    const whatsappLink = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`

    console.log("[whatsapp:test] Forcing link mode for reliability")

    return NextResponse.json(
      {
        success: true,
        message_sent: false,
        method: "link",
        whatsapp_link: whatsappLink,
        to: targetPhone,
        message: message.substring(0, 100) + "...",
        explanation: "Sistema configurado en modo link para máxima compatibilidad",
        debug: {
          api_result: result,
          strategy: strategy,
          store_name: store.name,
          timestamp: new Date().toISOString(),
          credentials_configured: hasWhatsAppCredentials,
          forced_link_mode: true
        }
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error sending WhatsApp test message:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
