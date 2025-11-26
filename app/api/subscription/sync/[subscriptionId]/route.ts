import { NextRequest, NextResponse } from "next/server"
import { getSubscriptionService } from "@/lib/services/subscription-service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const { subscriptionId } = await params

    if (!subscriptionId) {
      return NextResponse.json({
        error: "subscriptionId es requerido"
      }, { status: 400 })
    }

    const subscriptionService = getSubscriptionService()
    const updatedSubscription = await subscriptionService.syncSubscriptionStatus(subscriptionId)

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: "Suscripción sincronizada exitosamente"
    })

  } catch (error: any) {
    console.error("Error sincronizando suscripción:", error)
    return NextResponse.json({ 
      error: "Error sincronizando suscripción",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
