import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { orderId, storeId, items, total, customer } = await request.json()

    const supabase = createAdminClient()

    // Get store settings for MercadoPago credentials
    const { data: storeSettings } = await supabase
      .from("store_settings")
      .select("mercadopago_access_token")
      .eq("store_id", storeId)
      .single()

    if (!storeSettings?.mercadopago_access_token) {
      return NextResponse.json({ error: "MercadoPago no configurado" }, { status: 400 })
    }

    // Create MercadoPago preference
    const preferenceData = {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: "ARS",
      })),
      payer: {
        name: customer.name,
        email: customer.email,
        phone: {
          number: customer.phone,
        },
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/store/payment/success?order_id=${orderId}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/store/payment/failure?order_id=${orderId}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/store/payment/pending?order_id=${orderId}`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      external_reference: orderId,
      statement_descriptor: "FOODY NOW",
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storeSettings.mercadopago_access_token}`,
      },
      body: JSON.stringify(preferenceData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("MercadoPago error:", errorData)
      return NextResponse.json({ error: "Error al crear preferencia de pago" }, { status: 500 })
    }

    const preference = await response.json()

    // Update order with payment preference ID
    await supabase.from("orders").update({ payment_id: preference.id }).eq("id", orderId)

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
    })
  } catch (error) {
    console.error("Payment preference error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
