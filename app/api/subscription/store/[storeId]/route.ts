import { NextRequest, NextResponse } from "next/server"
import { getSubscriptionService } from "@/lib/services/subscription-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params

    if (!storeId) {
      return NextResponse.json({
        error: "storeId es requerido"
      }, { status: 400 })
    }

    const subscriptionService = getSubscriptionService()
    const subscription = await subscriptionService.getSubscription(storeId)

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        active: false
      })
    }

    const isActive = await subscriptionService.isSubscriptionActive(storeId)
    const trialStatus = await subscriptionService.getTrialStatus(storeId)

    return NextResponse.json({
      subscription,
      active: isActive,
      trial: trialStatus
    })

  } catch (error: any) {
    console.error("Error obteniendo suscripción:", error)
    return NextResponse.json({ 
      error: "Error obteniendo información de suscripción",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params

    if (!storeId) {
      return NextResponse.json({
        error: "storeId es requerido"
      }, { status: 400 })
    }

    const subscriptionService = getSubscriptionService()
    await subscriptionService.cancelSubscription(storeId)

    return NextResponse.json({
      success: true,
      message: "Suscripción cancelada exitosamente"
    })

  } catch (error: any) {
    console.error("Error cancelando suscripción:", error)
    return NextResponse.json({ 
      error: "Error cancelando suscripción",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
