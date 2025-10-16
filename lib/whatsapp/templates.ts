import type { OrderStatus } from "@/lib/types/database"

interface BaseTemplateContext {
  orderId?: string
  customerName?: string
  storeName?: string
  total?: number
  deliveryType?: "pickup" | "delivery"
  deliveryAddress?: string | null
  paymentMethod?: string | null
  estimatedTime?: string | null
  trackingLink?: string | null
  supportPhone?: string | null
  pickupInstructions?: string | null
}

export type TemplateContext = BaseTemplateContext & Record<string, unknown>

export interface WhatsAppTemplateDefinition {
  /**
   * Nombre legible del mensaje para mostrar en la interfaz de configuración
   */
  title: string
  /**
   * Descripción del objetivo del mensaje
   */
  description: string
  /**
   * Generador del cuerpo del mensaje en español. Debe ser un texto plano listo para enviar.
   */
  buildMessage: (context: TemplateContext) => string
}

export type PurchaseProcessStep =
  | "order_created"
  | "payment_pending"
  | "payment_completed"
  | "payment_failed"
  | "payment_refunded"
  | "checkout_reminder"
  | "post_purchase_followup"

const formatCurrency = (amount?: number) => {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "el total de tu compra"
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount)
}

const resolveCustomerName = (name?: string) => (name ? `${name}` : "¡Hola!")

const resolveStoreName = (name?: string) => name ?? "nuestra tienda"

const formatDeliveryDetails = (context: TemplateContext) => {
  if (context.deliveryType === "pickup") {
    const instructions = context.pickupInstructions ||
      "Podrás retirarlo acercándote al local y brindando el número de pedido."

    return `🏪 *Retiro en local*\n${instructions}`
  }

  if (context.deliveryType === "delivery") {
    const address = context.deliveryAddress
      ? `📍 Dirección de entrega: ${context.deliveryAddress}`
      : "Nos comunicaremos para coordinar la dirección de entrega."

    const tracking = context.trackingLink ? `\n🔗 Seguimiento: ${context.trackingLink}` : ""

    return `🚚 *Delivery a domicilio*\n${address}${tracking}`
  }

  return ""
}

const formatEstimatedTime = (estimatedTime?: string | null) => {
  if (!estimatedTime) {
    return ""
  }

  return `⏰ Tiempo estimado: ${estimatedTime}`
}

const formatSupportLine = (supportPhone?: string | null) => {
  if (!supportPhone) {
    return ""
  }

  return `\n☎️ Si necesitas ayuda, podés escribirnos al ${supportPhone}.`
}

const baseMessage = (context: TemplateContext) => {
  const greeting = resolveCustomerName(context.customerName)
  const orderLine = context.orderId ? `#${context.orderId}` : "tu pedido"
  const store = resolveStoreName(context.storeName)
  const total = formatCurrency(context.total)

  return { greeting, orderLine, store, total }
}

export const ORDER_STATUS_TEMPLATES: Record<OrderStatus, WhatsAppTemplateDefinition> = {
  pending: {
    title: "Pedido pendiente",
    description: "Mensaje automático confirmando la recepción del pedido y que será revisado por el local.",
    buildMessage: (context) => {
      const { greeting, orderLine, store, total } = baseMessage(context)
      const estimated = formatEstimatedTime(context.estimatedTime)
      const deliveryDetails = formatDeliveryDetails(context)

      return (
        `${greeting} 👋\n\n` +
        `Recibimos ${orderLine} en ${store}. Estamos revisando la información para confirmarlo.\n` +
        `Importe total: ${total}.\n\n` +
        `${estimated ? `${estimated}\n` : ""}` +
        `${deliveryDetails ? `${deliveryDetails}\n\n` : ""}` +
        "Te avisaremos apenas lo confirmemos. ¡Gracias por elegirnos!" +
        formatSupportLine(context.supportPhone)
      )
    },
  },
  confirmed: {
    title: "Pedido confirmado",
    description: "Confirma al cliente que el pedido fue aprobado e indica próximos pasos.",
    buildMessage: (context) => {
      const { greeting, orderLine, store, total } = baseMessage(context)
      const estimated = formatEstimatedTime(context.estimatedTime)
      const deliveryDetails = formatDeliveryDetails(context)

      return (
        `${greeting} 👋\n\n` +
        `¡Buenas noticias! Confirmamos ${orderLine} en ${store}.\n` +
        `Importe total: ${total}.\n` +
        `${estimated ? `${estimated}\n` : ""}` +
        `${deliveryDetails ? `\n${deliveryDetails}\n` : ""}` +
        "Nos pondremos en contacto si necesitamos más información."
      )
    },
  },
  preparing: {
    title: "Pedido en preparación",
    description: "Informa al cliente que su pedido ya está siendo preparado y recuerda el tiempo estimado.",
    buildMessage: (context) => {
      const { greeting, orderLine, store } = baseMessage(context)
      const estimated = formatEstimatedTime(context.estimatedTime)
      const deliveryDetails = formatDeliveryDetails(context)

      return (
        `${greeting} 👋\n\n` +
        `${store} ya está preparando ${orderLine}.\n` +
        `${estimated ? `${estimated}\n` : ""}` +
        `${deliveryDetails ? `\n${deliveryDetails}\n` : ""}` +
        "Te mantendremos al tanto de cada avance."
      )
    },
  },
  ready: {
    title: "Pedido listo",
    description: "Notifica que el pedido ya está listo para retirar o salir a reparto.",
    buildMessage: (context) => {
      const { greeting, orderLine, store } = baseMessage(context)
      const deliveryDetails = formatDeliveryDetails(context)

      const pickupNotice =
        context.deliveryType === "pickup"
          ? "Podés pasar a retirarlo cuando gustes presentando tu nombre o número de pedido."
          : "Nuestro repartidor está saliendo en camino."

      return (
        `${greeting} 👋\n\n` +
        `${orderLine} de ${store} ya está listo.\n` +
        `${pickupNotice}\n` +
        `${deliveryDetails ? `\n${deliveryDetails}` : ""}` +
        formatSupportLine(context.supportPhone)
      )
    },
  },
  delivered: {
    title: "Pedido entregado",
    description: "Confirma que el pedido ya fue entregado y solicita feedback opcional.",
    buildMessage: (context) => {
      const { greeting, orderLine, store } = baseMessage(context)

      return (
        `${greeting} 👋\n\n` +
        `Confirmamos que ${orderLine} de ${store} fue entregado correctamente.\n` +
        "Esperamos que disfrutes tu pedido. Si querés contarnos tu experiencia, ¡tu opinión siempre suma!" +
        formatSupportLine(context.supportPhone)
      )
    },
  },
  cancelled: {
    title: "Pedido cancelado",
    description: "Informa al cliente que el pedido debió cancelarse y ofrece asistencia.",
    buildMessage: (context) => {
      const { greeting, orderLine, store } = baseMessage(context)
      const payment = context.paymentMethod ? `Método de pago: ${context.paymentMethod}.\n` : ""

      return (
        `${greeting} 👋\n\n` +
        `Lamentamos informarte que ${orderLine} en ${store} fue cancelado.\n` +
        `${payment}` +
        "Si ya realizaste un pago te contactaremos para coordinar la devolución. " +
        "Escribinos ante cualquier duda, estamos para ayudarte." +
        formatSupportLine(context.supportPhone)
      )
    },
  },
}

export const PURCHASE_PROCESS_TEMPLATES: Record<PurchaseProcessStep, WhatsAppTemplateDefinition> = {
  order_created: {
    title: "Nuevo pedido recibido",
    description: "Mensaje inicial al cliente con el resumen del pedido al completarlo en la tienda.",
    buildMessage: (context) => {
      const { greeting, orderLine, store, total } = baseMessage(context)
      const deliveryDetails = formatDeliveryDetails(context)

      return (
        `${greeting} 👋\n\n` +
        `¡Gracias por comprar en ${store}! Recibimos ${orderLine} con un total de ${total}.\n` +
        `${deliveryDetails ? `\n${deliveryDetails}\n` : ""}` +
        "En breve te confirmaremos la disponibilidad y el tiempo estimado." +
        formatSupportLine(context.supportPhone)
      )
    },
  },
  payment_pending: {
    title: "Pago pendiente",
    description: "Recordatorio con instrucciones para completar el pago del pedido.",
    buildMessage: (context) => {
      const { greeting, orderLine, store, total } = baseMessage(context)
      const paymentMethod = context.paymentMethod
        ? `Método de pago seleccionado: ${context.paymentMethod}.`
        : "Podés elegir el método de pago que prefieras."

      return (
        `${greeting} 👋\n\n` +
        `Para avanzar con ${orderLine} en ${store} necesitamos completar el pago por ${total}.\n` +
        `${paymentMethod}\n` +
        "Cuando lo tengas listo avisanos por este medio y lo confirmamos al instante." +
        formatSupportLine(context.supportPhone)
      )
    },
  },
  payment_completed: {
    title: "Pago confirmado",
    description: "Confirma la acreditación del pago y adelanta el siguiente paso del proceso.",
    buildMessage: (context) => {
      const { greeting, orderLine, store } = baseMessage(context)
      const estimated = formatEstimatedTime(context.estimatedTime)

      return (
        `${greeting} 👋\n\n` +
        `Confirmamos que el pago de ${orderLine} en ${store} se acreditó correctamente.\n` +
        `${estimated ? `${estimated}\n` : ""}` +
        "Seguiremos con la preparación y te avisaremos ante cualquier novedad." +
        formatSupportLine(context.supportPhone)
      )
    },
  },
  payment_failed: {
    title: "Pago rechazado",
    description: "Indica al cliente que el pago no se pudo procesar y propone alternativas.",
    buildMessage: (context) => {
      const { greeting, orderLine, store } = baseMessage(context)

      return (
        `${greeting} 👋\n\n` +
        `No pudimos procesar el pago de ${orderLine} en ${store}.\n` +
        "Te invitamos a intentar nuevamente o elegir otro método de pago. " +
        "Si ya se debitó, desestimá este mensaje; el reintegro se verá reflejado en los próximos minutos." +
        formatSupportLine(context.supportPhone)
      )
    },
  },
  payment_refunded: {
    title: "Pago reembolsado",
    description: "Confirma al cliente que se gestionó el reembolso del pago realizado.",
    buildMessage: (context) => {
      const { greeting, orderLine, store, total } = baseMessage(context)

      return (
        `${greeting} 👋\n\n` +
        `Gestionamos el reembolso de ${total} correspondiente a ${orderLine} en ${store}.\n` +
        "Dependiendo del banco, puede demorar hasta 72 horas hábiles en verse reflejado." +
        formatSupportLine(context.supportPhone)
      )
    },
  },
  checkout_reminder: {
    title: "Recordatorio de carrito",
    description: "Mensaje para clientes que iniciaron la compra pero no la finalizaron.",
    buildMessage: (context) => {
      const store = resolveStoreName(context.storeName)
      const total = formatCurrency(context.total)

      return (
        "¡Hola! 👋\n\n" +
        `Notamos que dejaste productos por ${total} esperando en ${store}.\n` +
        "Si necesitas ayuda para completar la compra o preferís que te la gestionemos por acá, respondé a este mensaje y te asisti" +
        "mos al instante."
      )
    },
  },
  post_purchase_followup: {
    title: "Seguimiento post compra",
    description: "Mensaje para agradecer la compra y ofrecer asistencia después de la entrega.",
    buildMessage: (context) => {
      const { greeting, store } = baseMessage(context)

      return (
        `${greeting} 👋\n\n` +
        `Queríamos agradecerte por elegir ${store}. Esperamos que tu experiencia haya sido excelente.\n` +
        "Si tenés comentarios o querés volver a hacer un pedido, escribinos por acá. ¡Estamos siempre disponibles para vos!"
      )
    },
  },
}

export const ALL_WHATSAPP_TEMPLATES: Record<
  OrderStatus | PurchaseProcessStep,
  WhatsAppTemplateDefinition
> = {
  ...ORDER_STATUS_TEMPLATES,
  ...PURCHASE_PROCESS_TEMPLATES,
}