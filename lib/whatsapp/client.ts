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
  private twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
  private twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
  private twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

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

  async sendMessage(to: string, message: string, fromNumber?: string): Promise<boolean> {
    if (!this.twilioAccountSid || !this.twilioAuthToken) {
      console.log("[v0] Twilio not configured, falling back to WhatsApp links")
      return false
    }

    // Use store-specific number or fallback to global Twilio number
    const whatsappNumber = fromNumber || process.env.TWILIO_WHATSAPP_NUMBER

    if (!whatsappNumber) {
      console.log("[v0] No WhatsApp number available, falling back to WhatsApp links")
      return false
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: `whatsapp:${whatsappNumber}`,
            To: `whatsapp:${to}`,
            Body: message,
          }),
        },
      )

      if (response.ok) {
        console.log("[v0] WhatsApp message sent successfully from", whatsappNumber)
        return true
      } else {
        const error = await response.text()
        console.error("[v0] Error sending WhatsApp message:", error)
        return false
      }
    } catch (error) {
      console.error("[v0] Error sending WhatsApp message:", error)
      return false
    }
  }

  async sendOrderNotification(
    order: OrderNotification,
    storeWhatsAppNumber?: string,
  ): Promise<{ success: boolean; link?: string }> {
    const message = decodeURIComponent(this.generateOrderNotification(order))

    const sent = await this.sendMessage(order.storePhone, message, storeWhatsAppNumber)

    if (sent) {
      return { success: true }
    } else {
      // Fallback to WhatsApp link
      const link = this.getOrderNotificationLink(order)
      return { success: false, link }
    }
  }

  async sendCustomerConfirmation(
    customerPhone: string,
    orderId: string,
    storeName: string,
    estimatedTime: string,
    storeWhatsAppNumber?: string,
  ): Promise<{ success: boolean; link?: string }> {
    const message = decodeURIComponent(this.generateCustomerConfirmation(orderId, storeName, estimatedTime))

    const sent = await this.sendMessage(customerPhone, message, storeWhatsAppNumber)

    if (sent) {
      return { success: true }
    } else {
      // Fallback to WhatsApp link
      const link = this.getCustomerConfirmationLink(customerPhone, orderId, storeName, estimatedTime)
      return { success: false, link }
    }
  }
}

export const whatsappService = new WhatsAppService()
