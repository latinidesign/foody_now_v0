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
          store_settings (
            whatsapp_number,
            whatsapp_enabled
          )
        )
      `)
      .eq("id", orderId)
      .single()

    if (!order || !order.stores?.whatsapp_notifications) {
      return NextResponse.json({ error: "Order not found or notifications disabled" }, { status: 404 })
    }

    const storeWhatsAppNumber = order.stores.store_settings?.whatsapp_number || order.stores.whatsapp_number

    const orderData = {
      orderId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      items: order.order_items.map((item: any) => ({
        name: item.products.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
      deliveryType: order.delivery_type,
      deliveryAddress: order.delivery_address,
      storePhone: order.stores.whatsapp_number,
      storeName: order.stores.name,
    }

    const storeNotification = await whatsappService.sendOrderNotification(orderData, storeWhatsAppNumber)
    const customerConfirmation = await whatsappService.sendCustomerConfirmation(
      orderData.customerPhone,
      orderId,
      orderData.storeName,
      "30-45 minutos",
      storeWhatsAppNumber,
    )

    return NextResponse.json({
      success: true,
      notifications: {
        storeNotification: storeNotification.success ? "sent" : storeNotification.link,
        customerConfirmation: customerConfirmation.success ? "sent" : customerConfirmation.link,
      },
    })
  } catch (error) {
    console.error("Error sending notifications:", error)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
