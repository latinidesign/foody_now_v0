interface WhatsAppMessage {
  to: string
  message: string
  storeSlug?: string
}

interface OrderNotification {
  orderId: string
  customerName: string
  customerPhone: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  deliveryType: "pickup" | "delivery"
  deliveryAddress?: string
  storePhone: string
  storeName: string
}

export class WhatsAppService {
  private baseUrl = "https://api.whatsapp.com/send"

  // Generate WhatsApp link for store access
  generateStoreLink(storeSlug: string, storePhone: string): string {
    const message = encodeURIComponent(
      `¡Hola! Me interesa ver tu catálogo de productos. ¿Podrías enviarme el link de tu tienda?`,
    )
    return `${this.baseUrl}?phone=${storePhone}&text=${message}`
  }

  // Generate WhatsApp link with store URL
  generateStoreLinkResponse(storeSlug: string, storeName: string): string {
    const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeSlug}`
    const message = encodeURIComponent(
      `¡Hola! Aquí tienes el link de nuestra tienda online de ${storeName}: ${storeUrl}\n\n¡Esperamos tu pedido!`,
    )
    return message
  }

  // Generate order notification for store owner
  generateOrderNotification(order: OrderNotification): string {
    const itemsList = order.items
      .map((item) => `• ${item.name} x${item.quantity} - $${item.price * item.quantity}`)
      .join("\n")

    const deliveryInfo =
      order.deliveryType === "delivery" ? `📍 Entrega a domicilio: ${order.deliveryAddress}` : "🏪 Retiro en local"

    const message = `🔔 *NUEVO PEDIDO* - #${order.orderId}

👤 Cliente: ${order.customerName}
📱 Teléfono: ${order.customerPhone}

📦 *Productos:*
${itemsList}

💰 *Total: $${order.total}*

${deliveryInfo}

¡Confirma la recepción del pedido y el tiempo estimado de preparación!`

    return encodeURIComponent(message)
  }

  // Generate customer confirmation message
  generateCustomerConfirmation(orderId: string, storeName: string, estimatedTime: string): string {
    const message = `✅ *Pedido Confirmado* - #${orderId}

¡Gracias por tu pedido en ${storeName}!

⏰ Tiempo estimado: ${estimatedTime}
📱 Te notificaremos cuando esté listo

¡Gracias por elegirnos!`

    return encodeURIComponent(message)
  }

  // Generate WhatsApp link for order notification to store
  getOrderNotificationLink(order: OrderNotification): string {
    const message = this.generateOrderNotification(order)
    return `${this.baseUrl}?phone=${order.storePhone}&text=${message}`
  }

  // Generate WhatsApp link for customer confirmation
  getCustomerConfirmationLink(
    customerPhone: string,
    orderId: string,
    storeName: string,
    estimatedTime: string,
  ): string {
    const message = this.generateCustomerConfirmation(orderId, storeName, estimatedTime)
    return `${this.baseUrl}?phone=${customerPhone}&text=${message}`
  }
}

export const whatsappService = new WhatsAppService()
