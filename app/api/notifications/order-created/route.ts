import { type NextRequest, NextResponse } from "next/server"
import { whatsappService } from "@/lib/whatsapp/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, storeSlug } = body

    // Here you would typically:
    // 1. Fetch order details from database
    // 2. Fetch store configuration
    // 3. Send notifications

    // For now, we'll return the WhatsApp links that can be used
    // In a real implementation, you might use a WhatsApp Business API

    const mockOrder = {
      orderId,
      customerName: "Cliente Ejemplo",
      customerPhone: "+5491123456789",
      items: [
        { name: "Hamburguesa Completa", quantity: 2, price: 1500 },
        { name: "Papas Fritas", quantity: 1, price: 800 },
      ],
      total: 3800,
      deliveryType: "delivery" as const,
      deliveryAddress: "Av. Corrientes 1234, CABA",
      storePhone: "+5491187654321",
      storeName: "Burger House",
    }

    const storeNotificationLink = whatsappService.getOrderNotificationLink(mockOrder)
    const customerConfirmationLink = whatsappService.getCustomerConfirmationLink(
      mockOrder.customerPhone,
      orderId,
      mockOrder.storeName,
      "30-45 minutos",
    )

    return NextResponse.json({
      success: true,
      notifications: {
        storeNotification: storeNotificationLink,
        customerConfirmation: customerConfirmationLink,
      },
    })
  } catch (error) {
    console.error("Error sending notifications:", error)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
