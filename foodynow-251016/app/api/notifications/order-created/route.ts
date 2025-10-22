import { type NextRequest, NextResponse } from "next/server"
import { whatsappService } from "@/lib/whatsapp/client"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, storeSlug } = body

    const supabase = await createClient()

    const { data: order } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          quantity,
          price,
          products (name)
        ),
        stores (
          name,
          whatsapp_number,
          whatsapp_notifications,
          store_settings (*)
        )
      `)
      .eq("id", orderId)
      .single()

    if (!order || !order.stores?.whatsapp_notifications) {
      return NextResponse.json({ error: "Order not found or notifications disabled" }, { status: 404 })
    }

    const storeSettings = order.stores.store_settings || {}
    const waPhoneNumberId = storeSettings.wa_phone_number_id as string | undefined
    const waAccessToken = storeSettings.wa_access_token as string | undefined
    const waApiVersion = storeSettings.wa_api_version as string | undefined

    const normalizeComponents = (value: unknown) => {
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

    const resolveStrategy = (
      strategyValue: unknown,
      templateName?: unknown,
      templateLanguage?: unknown,
      templateComponents?: unknown,
    ) => {
      const strategy = typeof strategyValue === "string" ? strategyValue.toLowerCase() : undefined

      if (strategy === "template") {
        const name = typeof templateName === "string" ? templateName : undefined
        const language = typeof templateLanguage === "string" ? templateLanguage : "es"
        const components = normalizeComponents(templateComponents)

        if (name) {
          return {
            type: "template" as const,
            name,
            languageCode: language,
            components,
          }
        }
      }

      return { type: "text" as const }
    }

    const orderStrategy = resolveStrategy(
      storeSettings.wa_order_strategy ?? storeSettings.wa_strategy ?? storeSettings.whatsapp_strategy,
      storeSettings.wa_order_template_name ?? storeSettings.wa_template_name,
      storeSettings.wa_order_template_language ?? storeSettings.wa_template_language,
      storeSettings.wa_order_template_components ?? storeSettings.wa_template_components,
    )

    const customerStrategy = resolveStrategy(
      storeSettings.wa_customer_strategy ?? storeSettings.wa_strategy ?? storeSettings.whatsapp_strategy,
      storeSettings.wa_customer_template_name ?? storeSettings.wa_template_name,
      storeSettings.wa_customer_template_language ?? storeSettings.wa_template_language,
      storeSettings.wa_customer_template_components ?? storeSettings.wa_template_components,
    )

    const targetStorePhone = storeSettings.whatsapp_number || order.stores.whatsapp_number

    const orderItems = Array.isArray(order.order_items) ? order.order_items : []

    const orderData = {
      orderId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      items: orderItems.map((item: any) => ({
        name: item.products.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
      deliveryType: order.delivery_type,
      deliveryAddress: order.delivery_address,
      storePhone: targetStorePhone,
      storeName: order.stores.name,
    }

    const credentials =
      waPhoneNumberId && waAccessToken ? { waPhoneNumberId, waAccessToken, apiVersion: waApiVersion } : undefined

    if (!credentials) {
      console.warn(
        `[v0] Missing WhatsApp Cloud API credentials for store ${storeSlug ?? order.stores?.name ?? order.stores?.id}, using fallback links`,
      )
    }

    const storeNotification = await whatsappService.sendOrderNotification(orderData, {
      credentials,
      strategy: orderStrategy,
    })
    const customerConfirmation = await whatsappService.sendCustomerConfirmation(
      orderData.customerPhone,
      orderId,
      orderData.storeName,
      "30-45 minutos",
      {
        credentials,
        strategy: customerStrategy,
      },
    )

    return NextResponse.json({
      success: true,
      notifications: {
        storeNotification,
        customerConfirmation,
      },
    })
  } catch (error) {
    console.error("Error sending notifications:", error)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
