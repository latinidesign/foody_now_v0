import { randomUUID } from "crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    let body: any

    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json(
        { error: "Payload inválido", details: "No se pudo leer el body de la solicitud" },
        { status: 400 },
      )
    }

    const { storeId, items, orderData, subtotal, deliveryFee, total } = body

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId faltante", details: "Debes enviar el identificador del local" },
        { status: 400 },
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "Items inválidos",
          details: "Debes enviar un arreglo con los productos del pedido",
        },
        { status: 400 },
      )
    }

    if (!orderData?.customerEmail || !orderData?.customerName) {
      return NextResponse.json(
        {
          error: "Datos del cliente incompletos",
          details: "Nombre y email del cliente son obligatorios",
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // Get store settings for MercadoPago credentials
    const { data: storeSettings, error: storeSettingsError } = await supabase
      .from("store_settings")
      .select("mercadopago_access_token")
      .eq("store_id", storeId)
      .single()

    if (storeSettingsError) {
      console.error("Failed to fetch store settings:", storeSettingsError)
      return NextResponse.json(
        {
          error: "Configuración de tienda inválida",
          details: storeSettingsError.message,
        },
        { status: 400 },
      )
    }

    if (!storeSettings?.mercadopago_access_token) {
      return NextResponse.json({ error: "MercadoPago no configurado" }, { status: 400 })
    }
    const externalReference = randomUUID()

    const { data: checkoutSession, error: sessionError } = await supabase
      .from("checkout_sessions")
      .insert({
        store_id: storeId,
        items,
        order_data: orderData,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        external_reference: externalReference,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single()

    if (sessionError || !checkoutSession) {
      console.error("Failed to create checkout session:", sessionError)
      return NextResponse.json(
        {
          error: "No se pudo iniciar el pago",
          details: sessionError?.message ?? "Error desconocido al crear la sesión",
        },
        { status: 500 },
      )
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error("NEXT_PUBLIC_APP_URL is not configured")
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
        name: orderData.customerName,
        email: orderData.customerEmail,
        phone: {
          number: orderData.customerPhone,
        },
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/store/payment/success?session_id=${checkoutSession.id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/store/payment/failure?session_id=${checkoutSession.id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/store/payment/pending?session_id=${checkoutSession.id}`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      external_reference: externalReference,
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
      let errorData: unknown

      try {
        errorData = await response.json()
      } catch (responseParseError) {
        console.error("Failed to parse MercadoPago error response:", responseParseError)
      }

      console.error("MercadoPago error:", errorData)

      await supabase
        .from("checkout_sessions")
        .update({
          status: "failed",
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkoutSession.id)

      return NextResponse.json(
        {
          error: "Error al crear preferencia de pago",
          details: errorData,
        },
        { status: 502 },
      )
    }

    const preference = await response.json()

    const { error: updateSessionError } = await supabase
      .from("checkout_sessions")
      .update({
        preference_id: preference.id,
        preference_payload: preferenceData,
        init_point: preference.init_point,
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkoutSession.id)

    if (updateSessionError) {
      console.error("Failed to update checkout session:", updateSessionError)
    }

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sessionId: checkoutSession.id,
    })
  } catch (error) {
    console.error("Payment preference error:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
