import { NextResponse } from "next/server"
import { getSubscriptionService } from "@/lib/services/subscription-service"
import { MercadoPagoWebhookEvent } from "@/lib/types/subscription"

export async function POST(request: Request) {
  try {
    const body: MercadoPagoWebhookEvent = await request.json()
    
    console.log("🔔 Webhook recibido:", {
      type: body.type,
      action: body.action,
      id: body.data?.id
    })

    const subscriptionService = getSubscriptionService()
    
    // Procesar el webhook usando el servicio
    await subscriptionService.handleWebhook(body)

    return NextResponse.json({ 
      received: true, 
      processed: true 
    })

  } catch (error: any) {
    console.error("❌ Error procesando webhook:", error)
    return NextResponse.json({ 
      error: "Error procesando webhook",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
