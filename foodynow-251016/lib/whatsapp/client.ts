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

export type WhatsAppMessageStrategy =
  | { type: "text" }
  | {
      type: "template"
      name: string
      languageCode: string
      components?: Array<Record<string, unknown>>
    }

interface WhatsAppCloudApiCredentials {
  waPhoneNumberId?: string
  waAccessToken?: string
  apiVersion?: string
}

type WhatsAppMessagePayload =
  | {
      type: "text"
      text: { body: string }
    }
  | {
      type: "template"
      template: {
        name: string
        language: { code: string }
        components?: Array<Record<string, unknown>>
      }
    }

interface SendMessageParams {
  to: string
  credentials: WhatsAppCloudApiCredentials
  payload: WhatsAppMessagePayload
}

interface SendMessageResult {
  success: boolean
  error?: string
}

interface SendMessageOptions {
  credentials?: WhatsAppCloudApiCredentials
  strategy?: WhatsAppMessageStrategy
}

export class WhatsAppService {
  private baseUrl = "https://api.whatsapp.com/send"
  private defaultApiVersion = process.env.WHATSAPP_API_VERSION || "v20.0"

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

  private async sendCloudApiMessage({ to, credentials, payload }: SendMessageParams): Promise<SendMessageResult> {
    if (!to) {
      return { success: false, error: "missing_destination" }
    }

    const { waPhoneNumberId, waAccessToken, apiVersion } = credentials

    if (!waPhoneNumberId || !waAccessToken) {
      return { success: false, error: "missing_credentials" }
    }

    const version = apiVersion || this.defaultApiVersion
    const url = `https://graph.facebook.com/${version}/${waPhoneNumberId}/messages`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${waAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          ...payload,
        }),
      })

      if (response.ok) {
        return { success: true }
      }

      const error = await response.text()
      return { success: false, error: error || `Request failed with status ${response.status}` }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      return { success: false, error: message }
    }
  }

  private buildMessagePayload(message: string, options?: SendMessageOptions): WhatsAppMessagePayload {
    const strategy = options?.strategy

    if (strategy?.type === "template") {
      const components = strategy.components?.length ? strategy.components : undefined

      if (strategy.name && strategy.languageCode) {
        return {
          type: "template",
          template: {
            name: strategy.name,
            language: { code: strategy.languageCode },
            ...(components ? { components } : {}),
          },
        }
      }
    }

    return {
      type: "text",
      text: {
        body: message,
      },
    }
  }

  async sendOrderNotification(
    order: OrderNotification,
    options?: SendMessageOptions,
  ): Promise<{ success: boolean; link?: string; error?: string }> {
    const message = decodeURIComponent(this.generateOrderNotification(order))
    const payload = this.buildMessagePayload(message, options)

    const sendResult = options?.credentials
      ? await this.sendCloudApiMessage({
          to: order.storePhone,
          credentials: options.credentials,
          payload,
        })
      : { success: false, error: "missing_credentials" }

    if (sendResult.success) {
      return { success: true }
    }

    const link = this.getOrderNotificationLink(order)
    return { success: false, link, error: sendResult.error }
  }

  async sendCustomerConfirmation(
    customerPhone: string,
    orderId: string,
    storeName: string,
    estimatedTime: string,
    options?: SendMessageOptions,
  ): Promise<{ success: boolean; link?: string; error?: string }> {
    const message = decodeURIComponent(this.generateCustomerConfirmation(orderId, storeName, estimatedTime))
    const payload = this.buildMessagePayload(message, options)

    const sendResult = options?.credentials
      ? await this.sendCloudApiMessage({
          to: customerPhone,
          credentials: options.credentials,
          payload,
        })
      : { success: false, error: "missing_credentials" }

    if (sendResult.success) {
      return { success: true }
    }

    const link = this.getCustomerConfirmationLink(customerPhone, orderId, storeName, estimatedTime)
    return { success: false, link, error: sendResult.error }
  }

  async sendTextMessage(
    to: string,
    message: string,
    options?: SendMessageOptions,
  ): Promise<{ success: boolean; link?: string; error?: string }> {
    const payload = this.buildMessagePayload(message, options)

    const sendResult = options?.credentials
      ? await this.sendCloudApiMessage({
          to,
          credentials: options.credentials,
          payload,
        })
      : { success: false, error: "missing_credentials" as const }

    if (sendResult.success) {
      return { success: true }
    }

    const link = `${this.baseUrl}?phone=${to}&text=${encodeURIComponent(message)}`
    return { success: false, link, error: sendResult.error }
  }
}

export const whatsappService = new WhatsAppService()
