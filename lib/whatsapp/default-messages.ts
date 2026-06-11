export type OrderStatus = "confirmed" | "preparing" | "ready" | "sent" | "delivered" | "cancelled"

export const ORDER_STATUSES: OrderStatus[] = [
  "confirmed",
  "preparing",
  "ready",
  "sent",
  "delivered",
  "cancelled",
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo para retirar",
  sent: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

export interface MessageVariables {
  orderNumber: string
  storeName: string
  customerName: string
  items: string
  total: string
  deliveryAddress?: string
  statusText: string
}

export const VAR_PLACEHOLDERS: Record<keyof MessageVariables, string> = {
  orderNumber: "{order_number}",
  storeName: "{store_name}",
  customerName: "{customer_name}",
  items: "{items}",
  total: "{total}",
  deliveryAddress: "{delivery_address}",
  statusText: "{status_text}",
}

export function fillVariables(template: string, vars: MessageVariables): string {
  return template
    .replace(/\{order_number\}/g, vars.orderNumber)
    .replace(/\{store_name\}/g, vars.storeName)
    .replace(/\{customer_name\}/g, vars.customerName)
    .replace(/\{items\}/g, vars.items)
    .replace(/\{total\}/g, vars.total)
    .replace(/\{delivery_address\}/g, vars.deliveryAddress ?? "")
    .replace(/\{status_text\}/g, vars.statusText)
}

export const DEFAULT_MESSAGES: Record<OrderStatus, string> = {
  confirmed: `🎉 *¡Pedido Confirmado!*

📦 Pedido: #{order_number}
🏪 {store_name}
👤 {customer_name}

✅ *Tu pedido ha sido confirmado y está en proceso*

📋 *Resumen del pedido:*
{items}

💰 Total: {total}

⏰ *Tiempo estimado:* 30-45 minutos
📱 Te mantendremos informado del progreso.

¡Gracias por tu pedido!

---
*{store_name} - FoodyNow*`,

  preparing: `👨‍🍳 *¡Tu pedido se está preparando!*

📦 Pedido: #{order_number}
🏪 {store_name}
👤 {customer_name}

🔥 *Nuestros chefs están preparando tu pedido*

📋 *Tu pedido incluye:*
{items}

⏰ *Tiempo estimado restante:* 15-20 minutos
🍕 ¡Ya casi está listo!

---
*{store_name} - FoodyNow*`,

  ready: `🎉 *¡Tu pedido está LISTO para retirar!*

📦 Pedido: #{order_number}
🏪 {store_name}
👤 {customer_name}

✅ *Tu pedido está preparado y listo para retirar*

📋 *Tu pedido:*
{items}

💰 Total: {total}

📍 *Dirección para retirar:*
{delivery_address}

⏰ *Horario de retiro:*
Lun a Dom: 11:00 - 23:00

🚗 ¡Vení a retirarlo! Te esperamos.

¡Gracias por elegirnos!

---
*{store_name} - FoodyNow*`,

  sent: `🚴‍♂️ *¡Tu pedido está EN CAMINO!*

📦 Pedido: #{order_number}
🏪 {store_name}
👤 {customer_name}

📦 *Nuestro repartidor está en camino hacia tu ubicación*

📋 *Tu pedido:*
{items}

💰 Total: {total}

📍 *Dirección de entrega:*
{delivery_address}

📱 Te contactaremos al llegar a tu puerta.
⏰ Tiempo estimado: 10-15 minutos

¡Gracias por tu paciencia!

---
*{store_name} - FoodyNow*`,

  delivered: `✅ *¡Pedido Entregado!*

📦 Pedido: #{order_number}
🏪 {store_name}
👤 {customer_name}

🎉 *Tu pedido ha sido entregado exitosamente*

📋 *Pedido completado:*
{items}

💰 Total: {total}

⭐ *¿Cómo estuvo tu experiencia?*
Tu opinión nos ayuda a mejorar.

¡Esperamos verte pronto de nuevo!

---
*{store_name} - FoodyNow*`,

  cancelled: `❌ *Pedido Cancelado*

📦 Pedido: #{order_number}
🏪 {store_name}
👤 {customer_name}

😔 *Tu pedido ha sido cancelado*

💰 Si realizaste un pago, será reembolsado en 2-3 días hábiles.

📱 Si tienes preguntas, no dudes en contactarnos.

¡Esperamos poder atenderte pronto!

---
*{store_name} - FoodyNow*`,
}
