import { NextRequest, NextResponse } from "next/server"
import { getSubscriptionService } from "@/lib/services/subscription-service"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params
    const { action } = await request.json()

    if (!storeId) {
      return NextResponse.json({
        error: "storeId es requerido"
      }, { status: 400 })
    }

    if (!action || !['pause', 'resume'].includes(action)) {
      return NextResponse.json({
        error: "action debe ser 'pause' o 'resume'"
      }, { status: 400 })
    }

    const subscriptionService = getSubscriptionService()

    if (action === 'pause') {
      await subscriptionService.pauseSubscription(storeId)
    } else {
      await subscriptionService.resumeSubscription(storeId)
    }

    return NextResponse.json({
      success: true,
      message: `Suscripción ${action === 'pause' ? 'pausada' : 'reanudada'} exitosamente`
    })

  } catch (error: any) {
    console.error("Error gestionando suscripción:", error)
    return NextResponse.json({ 
      error: "Error gestionando suscripción",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
