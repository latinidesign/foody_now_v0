"use client"

import type { Order } from "@/lib/types/database"
import { useState, useMemo, useEffect, useRef } from "react"
import { memo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Eye,
  Phone,
  MapPin,
  Search,
  X,
  MessageCircle,
  Printer,
} from "lucide-react"
import { getBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { AnalyticsDateSelector } from "@/components/admin/analytics-date-selector"
import { getPaymentMethodLabel } from "@/lib/payments/methods"
import { formatOrderNumber } from "@/lib/utils"
import { useBrowserPrint } from "@/hooks/use-browser-print"
import { Switch } from "@/components/ui/switch"

interface OrderWithItems extends Order {
  auto_printed_at: string | null
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    selected_options?: Record<string, any> | null
    products: {
      name: string
      product_options?: Array<{
        id: string
        name: string
        type: string
        product_option_values?: Array<{ id: string; name: string }>
      }>
    }
  }>
  payments: Array<{
    id: string
    payment_method?: string
    provider?: string
    status?: string
  }>
}

const parseSelectedOptions = (raw: unknown): Record<string, any> | null => {
  if (!raw) return null
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  if (typeof raw === "object" && raw !== null) {
    return raw as Record<string, any>
  }

  return null
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value)

const formatPriceModifier = (price: number): string => {
  if (price === 0) return ""
  return ` (+${formatCurrency(price)})`
}

const getSelectedOptionsSummary = (selectedOptions: unknown, product: any): string[] => {
  const parsed = parseSelectedOptions(selectedOptions)
  if (!parsed || !product?.product_options) return []

  return Object.entries(parsed).flatMap(([optionId, optionValue]) => {
    const option = (product.product_options as any[]).find((option: any) => option.id === optionId)
    if (!option) return []

    const values = option.product_option_values ?? []

    if (option.type === "single") {
      const value = values.find((v: any) => v.id === optionValue)
      if (!value) return [optionValue]
      return [`${value.name}${formatPriceModifier(value.price_modifier ?? 0)}`]
    }

    if (option.type === "multiple" && Array.isArray(optionValue)) {
      return optionValue.map((valueId: string) => {
        const value = values.find((v: any) => v.id === valueId)
        if (!value) return valueId
        return `${value.name}${formatPriceModifier(value.price_modifier ?? 0)}`
      })
    }

    if (option.type === "quantity" && typeof optionValue === "object" && optionValue !== null) {
      return Object.entries(optionValue as Record<string, number>)
        .map(([valueId, qty]) => {
          const value = values.find((v: any) => v.id === valueId)
          if (!value) return `${qty} x ${valueId}`
          const unitPrice = value.price_modifier ?? 0
          const totalPrice = unitPrice * qty
          return `${qty} x ${value.name}${formatPriceModifier(totalPrice)}`
        })
        .filter(Boolean)
    }

    return []
  })
}

interface StoreInfo {
  name?: string
  phone?: string
  address?: string
}

interface OrdersTableProps {
  storeId: string
  orders: OrderWithItems[]
  store?: StoreInfo
}

// Keys para localStorage: estado de dispositivo, no de cuenta
const MOUNTED_AT_KEY = "orders_panel_mounted_at"
const AUTO_PRINT_ENABLED_KEY = "orders_auto_print_enabled"

export const OrdersTable = memo(function OrdersTable({ storeId, orders, store }: OrdersTableProps) {
  const [ordersData, setOrdersData] = useState<OrderWithItems[]>(orders)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
  const handledOrderIdRef = useRef<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all")
  const [whatsappModal, setWhatsappModal] = useState<{
    isOpen: boolean
    order: OrderWithItems | null
    message: string
    link: string | null
  }>({ isOpen: false, order: null, message: "", link: null })

  // Estado de auto-impresión: activado por defecto, persistido en localStorage
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(
    () => localStorage.getItem(AUTO_PRINT_ENABLED_KEY) !== "false"
  )

  // Browser printing hook
  const { print: browserPrint } = useBrowserPrint()

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getBrowserClient()

  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const buildTicketHtml = (order: OrderWithItems) => {
    const createdAt = new Date(order.created_at)
    const date = createdAt.toLocaleDateString("es-AR")
    const time = createdAt.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const itemsHtml = order.order_items
      .map((item) => {
        const optionLines = getSelectedOptionsSummary(item.selected_options, item.products)
          .map((line) => `
            <div class="item option-line">
              <span class="qty"></span>
              <span class="name">${line}</span>
              <span class="price"></span>
            </div>
          `)
          .join("")

        return `
          <div class="item">
            <span class="qty">${item.quantity}x</span>
            <span class="name">${item.products.name}</span>
            <span class="price">${formatCurrency(item.total_price)}</span>
          </div>
          ${optionLines}
        `
      })
      .join("")

    const deliveryLabel = order.delivery_type === "pickup" ? "Retiro en local" : "Delivery"

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido #${formatOrderNumber(order.order_number)}</title>
          <style>
            @page { size: 80mm auto; margin: 5mm; }
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              width: 72mm;
              margin: 0 auto;
              color: #000;
            }
            .ticket { padding: 6px; padding-bottom: 2cm; }
            .title { text-align: center; font-weight: 700; font-size: 16px; margin-bottom: 4px; }
            .meta { text-align: center; font-size: 12px; margin-bottom: 6px; }
            .order-number { font-size: 1.2rem; line-height: 1.4rem; }
            .meta-large { font-size: 1.5rem; line-height: 2rem; }
            .section { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; gap: 6px; }
            .row-medium { font-size: 1.2rem; line-height: 1.4rem; }
            .item { display: flex; justify-content: space-between; gap: 6px; font-size: 12px; margin-bottom: 3px; }
            .option-line { font-size: 8px; color: #333; margin-left: 20px; }
            .qty { min-width: 28px; font-size: 1.5rem;}
            .name { flex: 1; font-size: 0.9rem; line-height: 1.1rem; font-weight: 600; }
            .price { min-width: 60px; text-align: right; }
            .bold { font-weight: 700; }
            .notes { background: #f0f0f0; padding: 6px; border-radius: 4px; font-size: 1.5rem; line-height: 1.6rem; }
            .totals { margin-top: 4px; }
            .total-row { font-size: 1.5rem; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="title">${store?.name || "Pedido"}</div>
            <div class="meta">${[store?.address, store?.phone].filter(Boolean).join(" · ")}</div>
            <div class="meta order-number">Pedido #${formatOrderNumber(order.order_number)}</div>
            <div class="meta meta-large">${date} ${time}</div>
            <div class="meta meta-large">${deliveryLabel}</div>
            <div class="meta">Pago: ${getPaymentMethodText(order.payments)}${order.payments?.[0]?.provider === "manual" ? "" : order.payment_status === "completed" ? " (Pagado)" : " (Pendiente)"}</div>

            <div class="section">
              <div class="row row-medium"><span class="bold">Cliente</span><span>${order.customer_name}</span></div>
              ${order.customer_phone ? `<div class="row row-medium"><span class="bold">Tel</span><span>${order.customer_phone}</span></div>` : ""}
              ${
                order.delivery_address
                  ? `<div class="row row-medium"><span class="bold">Dirección</span><span>${order.delivery_address}</span></div>`
                  : ""
              }
            </div>

            <div class="section">
              ${itemsHtml}
            </div>

            <div class="section totals">
              <div class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal ?? 0)}</span></div>
              <div class="row"><span>Envío</span><span>${(order.delivery_fee ?? 0) > 0 ? formatCurrency(order.delivery_fee!) : "No incluye precio de delivery"}</span></div>
              <div class="row total-row"><span>Total</span><span>${formatCurrency(order.total ?? 0)}</span></div>
            </div>

            ${
              order.delivery_notes
                ? `<div class="section">
                     <div class="notes"><strong>Notas:</strong><br />${order.delivery_notes}</div>
                   </div>`
                : ""
            }

            <div class="meta" style="margin-top: 8px;">Gracias por tu compra</div>
          </div>
        </body>
      </html>
    `
  }

  const handlePrintTicket = (order: OrderWithItems) => {
    const printWindow = window.open("", "_blank", "width=400,height=600")

    if (!printWindow) {
      toast.error("No se pudo abrir la ventana de impresión")
      return
    }

    const ticketHtml = buildTicketHtml(order)
    printWindow.document.write(ticketHtml)
    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  const refreshOrders = async () => {
    setIsRefreshing(true)

    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Error refreshing orders: ${response.status}`)
      }

      const data = await response.json()
      if (Array.isArray(data.orders)) {
        setOrdersData(data.orders)

        // Auto-impresión: detectar pedidos nuevos e imprimir
        const mountedAt = localStorage.getItem(MOUNTED_AT_KEY)
        console.log("[AutoPrint] refreshOrders ejecutado.", {
          autoPrintEnabled,
          mountedAt,
          ordersCount: data.orders.length,
        })

        if (autoPrintEnabled && mountedAt) {
          const mountedAtDate = new Date(mountedAt)
          console.log("[AutoPrint] Buscando candidatos. mountedAt =", mountedAt)

          const candidates = data.orders.filter((order: OrderWithItems) => {
            const isCandidate =
              order.auto_printed_at === null &&
              new Date(order.created_at) > mountedAtDate
            if (isCandidate) {
              console.log(`[AutoPrint] Candidato: order #${order.order_number} (${order.id}) created=${order.created_at} auto_printed_at=${order.auto_printed_at}`)
            }
            return isCandidate
          })

          console.log(`[AutoPrint] ${candidates.length} candidato(s) encontrado(s).`)

          for (const order of candidates) {
            try {
              console.log(`[AutoPrint] Imprimiendo order #${order.order_number}...`)
              const html = buildTicketHtml(order)
              await browserPrint(html)
              console.log(`[AutoPrint] Impresión completada para order #${order.order_number}.`)

              // Marcar como impreso en Supabase
              await markOrderAsPrinted(order.id)
              console.log(`[AutoPrint] Order #${order.order_number} marcado como impreso en Supabase.`)
            } catch (error) {
              console.error(`[AutoPrint] Error auto-printing order ${order.id}:`, error)
            }
          }
        } else {
          const razones: string[] = []
          if (!autoPrintEnabled) razones.push("autoPrintEnabled=false")
          if (!mountedAt) razones.push("mountedAt es null")
          console.log("[AutoPrint] Auto-impresión saltada. Razones:", razones.join(", "))
        }
      }
    } catch (error) {
      console.error("Error refreshing orders:", error)
      toast.error("Error al actualizar los pedidos")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Marcar pedido como impreso en Supabase
  const markOrderAsPrinted = async (orderId: string): Promise<void> => {
    const { error } = await supabase
      .from("orders")
      .update({ auto_printed_at: new Date().toISOString() })
      .eq("id", orderId)

    if (error) {
      // Loggear pero no throw: protección contra reimprimir por timestamp de montaje
      console.error(`Error marking order ${orderId} as printed:`, error)
    }
  }

  const handleAutoPrintToggle = (enabled: boolean) => {
    setAutoPrintEnabled(enabled)
    localStorage.setItem(AUTO_PRINT_ENABLED_KEY, String(enabled))
  }

  // Guardar referencia estable a refreshOrders para usarla en efectos
  const refreshOrdersRef = useRef(refreshOrders)
  refreshOrdersRef.current = refreshOrders

  // Inicializar timestamp de montaje: sobreescribir en cada visita
  // Garantiza que pedidos históricos no se reimpriman en nueva sesión
  useEffect(() => {
    localStorage.setItem(MOUNTED_AT_KEY, new Date().toISOString())
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel(`orders-realtime-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          refreshOrdersRef.current()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId])

  useEffect(() => {
    const orderId = searchParams.get("orderId")
    if (orderId && ordersData.length > 0 && handledOrderIdRef.current !== orderId) {
      const order = ordersData.find((o) => o.id === orderId)
      if (order) {
        setSelectedOrder(order)
        handledOrderIdRef.current = orderId
      }
    }
  }, [searchParams, ordersData])

  const filteredAndSortedOrders = useMemo(() => {
    const filtered = ordersData.filter((order) => {
      const searchMatch =
        searchTerm === "" ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_items.some((item) =>
          item.products.name.toLowerCase().includes(searchTerm.toLowerCase())
        )

      const statusMatch = statusFilter === "all" || order.status === statusFilter
      const deliveryMatch = deliveryFilter === "all" || order.delivery_type === deliveryFilter

      const orderDate = new Date(order.created_at).toISOString().split("T")[0]
      const dateFromMatch = !startDate || orderDate >= startDate
      const dateToMatch = !endDate || orderDate <= endDate

      return searchMatch && statusMatch && deliveryMatch && dateFromMatch && dateToMatch
    })

    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [ordersData, searchTerm, statusFilter, deliveryFilter, startDate, endDate])

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setDeliveryFilter("all")
    router.replace("/admin/orders")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "confirmed":
      case "preparing":
      case "ready":
      case "sent":
      case "delivered":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "confirmed":
        return "Confirmado"
      case "preparing":
        return "Preparando"
      case "ready":
        return "Listo"
      case "sent":
        return "Enviado"
      case "delivered":
        return "Entregado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const getPaymentMethodText = (
    payments?: OrderWithItems["payments"]
  ) => {
    const payment = payments?.[0]
    if (!payment) return "Sin pago"
    if (payment.provider === "manual") return "Efectivo"
    if (payment.provider === "mercadopago") {
      return getPaymentMethodLabel("mercadopago", payment.payment_method ?? null)
    }
    return payment.payment_method || "MercadoPago"
  }

  const getWhatsAppMessage = (order: OrderWithItems, status: string) => {
    const storeName = store?.name || "Tu tienda"
    const orderItems = order.order_items
      .map((item) => `• ${item.quantity}x ${item.products.name}`)
      .join("\n")

    switch (status) {
      case "confirmed":
        return `🎉 *¡Pedido Confirmado!*

📦 Pedido: #${formatOrderNumber(order.order_number)}
🏪 ${storeName}
👤 ${order.customer_name}

✅ *Tu pedido ha sido confirmado y está en proceso*

📋 *Resumen del pedido:*
${orderItems}

💰 Total: ${formatCurrency(order.total ?? 0)}

⏰ *Tiempo estimado:* 30-45 minutos
📱 Te mantendremos informado del progreso.

¡Gracias por tu pedido!

---
*${storeName} - FoodyNow*`
      case "preparing":
        return `👨‍🍳 *¡Tu pedido se está preparando!*

📦 Pedido: #${formatOrderNumber(order.order_number)}
🏪 ${storeName}
👤 ${order.customer_name}

🔥 *Nuestros chefs están preparando tu pedido*

📋 *Tu pedido incluye:*
${orderItems}

⏰ *Tiempo estimado restante:* 15-20 minutos
🍕 ¡Ya casi está listo!

---
*${storeName} - FoodyNow*`
      case "ready":
        return `🎉 *¡Tu pedido está LISTO para retirar!*

📦 Pedido: #${formatOrderNumber(order.order_number)}
🏪 ${storeName}
👤 ${order.customer_name}

✅ *Tu pedido está preparado y listo para retirar*

📋 *Tu pedido:*
${orderItems}

💰 Total: ${formatCurrency(order.total ?? 0)}

📍 *Dirección para retirar:*
${order.delivery_address || "Ver ubicación en la app"}

⏰ *Horario de retiro:*
Lun a Dom: 11:00 - 23:00

🚗 ¡Vení a retirarlo! Te esperamos.

¡Gracias por elegirnos!

---
*${storeName} - FoodyNow*`
      case "sent":
        return `🚴‍♂️ *¡Tu pedido está EN CAMINO!*

📦 Pedido: #${formatOrderNumber(order.order_number)}
🏪 ${storeName}
👤 ${order.customer_name}

📦 *Nuestro repartidor está en camino hacia tu ubicación*

📋 *Tu pedido:*
${orderItems}

💰 Total: ${formatCurrency(order.total ?? 0)}

📍 *Dirección de entrega:*
${order.delivery_address || "Sin dirección registrada"}

📱 Te contactaremos al llegar a tu puerta.
⏰ Tiempo estimado: 10-15 minutos

¡Gracias por tu paciencia!

---
*${storeName} - FoodyNow*`
      case "delivered":
        return `✅ *¡Pedido Entregado!*

📦 Pedido: #${formatOrderNumber(order.order_number)}
🏪 ${storeName}
👤 ${order.customer_name}

🎉 *Tu pedido ha sido entregado exitosamente*

📋 *Pedido completado:*
${orderItems}

💰 Total: ${formatCurrency(order.total ?? 0)}

⭐ *¿Cómo estuvo tu experiencia?*
Tu opinión nos ayuda a mejorar.

¡Esperamos verte pronto de nuevo!

---
*${storeName} - FoodyNow*`
      case "cancelled":
        return `❌ *Pedido Cancelado*

📦 Pedido: #${formatOrderNumber(order.order_number)}
🏪 ${storeName}
👤 ${order.customer_name}

😔 *Tu pedido ha sido cancelado*

💰 Si realizaste un pago, será reembolsado en 2-3 días hábiles.

📱 Si tienes preguntas, no dudes en contactarnos.

¡Esperamos poder atenderte pronto!

---
*${storeName} - FoodyNow*`
      default:
        return `📦 *Actualización de Pedido*

Pedido: #${formatOrderNumber(order.order_number)}
Estado: ${getStatusText(status)}

¡Te mantendremos informado!

---
*${storeName} - FoodyNow*`
    }
  }

  const sendWhatsAppMessage = async (order: OrderWithItems, status: string) => {
    try {
      const message = getWhatsAppMessage(order, status)

      const response = await fetch(`/api/stores/${order.store_id}/whatsapp/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: order.customer_phone,
          message,
          strategy: "text",
        }),
      })

      const result = await response.json()

      if (result.whatsapp_link) {
        setWhatsappModal({
          isOpen: true,
          order,
          message,
          link: result.whatsapp_link,
        })
      } else if (result.success) {
        toast.success("Mensaje de WhatsApp enviado")
      } else {
        toast.error("Error al enviar mensaje de WhatsApp")
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error)
      toast.error("Error al enviar mensaje de WhatsApp")
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId)

    const previousOrders = ordersData
    const order = ordersData.find((o) => o.id === orderId)

    const isCashPayment = order?.payments?.[0]?.provider === "manual"
    const shouldCompletePayment =
      newStatus === "delivered" && isCashPayment && order?.payment_status !== "completed"

    const optimisticOrders = ordersData.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: newStatus,
            payment_status: shouldCompletePayment ? "completed" : o.payment_status,
          }
        : o
    )

    setOrdersData(optimisticOrders)

    try {
      const updateData: { status: string; payment_status?: string } = { status: newStatus }
      if (shouldCompletePayment) {
        updateData.payment_status = "completed"
      }

      const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)
      if (error) throw error

      if (order && order.customer_phone && newStatus !== "pending") {
        await sendWhatsAppMessage(order, newStatus)
      }

      toast.success("Estado del pedido actualizado")
    } catch (error) {
      console.error("Error updating order status:", error)
      setOrdersData(previousOrders)
      toast.error("Error al actualizar el estado del pedido")
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Pedidos</CardTitle>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por cliente o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-auto min-w-32 bg-background">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="preparing">Preparando</SelectItem>
                <SelectItem value="ready">Listo</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger className="w-auto min-w-32 bg-background">
                <SelectValue placeholder="Entrega" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg">
                <SelectItem value="all">Todas las entregas</SelectItem>
                <SelectItem value="pickup">Retiro</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>

            <AnalyticsDateSelector />

            <Button
              variant="outline"
              size="sm"
              onClick={refreshOrders}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Actualizando..." : "Refrescar ahora"}
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <label htmlFor="auto-print-toggle" className="text-sm font-medium">
                Impresión automática
              </label>
              <Switch
                id="auto-print-toggle"
                checked={autoPrintEnabled}
                onCheckedChange={handleAutoPrintToggle}
              />
            </div>

            {(searchTerm ||
              statusFilter !== "all" ||
              deliveryFilter !== "all" ||
              startDate ||
              endDate) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {filteredAndSortedOrders.length} de {ordersData.length} pedidos
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredAndSortedOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {ordersData.length === 0
                ? "No hay pedidos aún"
                : "No se encontraron pedidos con los filtros aplicados"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedOrders.map((order) => (
              <div
                key={order.id}
                className={`flex items-center gap-4 p-4 border rounded-lg ${
                  order.status === "pending"
                    ? "bg-fuchsia-50"
                    : order.status === "delivered"
                      ? "bg-gray-50"
                      : order.status === "ready" || order.status === "sent"
                        ? "bg-lime-50"
                        : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">#{formatOrderNumber(order.order_number)}</h3>
                    <Badge variant={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                    <Badge variant="outline">
                      {order.delivery_type === "pickup" ? "Retiro" : "Delivery"}
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">
                        {order.customer_name}
                      </p>
                      <p>{order.customer_phone}</p>
                    </div>
                    <div>
                      <p>
                        {new Date(order.created_at).toLocaleDateString("es-AR")}
                      </p>
                      <p>
                        {new Date(order.created_at).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="font-extrabold">
                        {formatCurrency(order.total ?? 0)}
                      </p>
                      <p>{order.order_items.length} productos</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePrintTicket(order)}
                    title="Imprimir ticket 80mm"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>

                  <Select
                    value={order.status}
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                    disabled={isUpdating === order.id}
                  >
                    <SelectTrigger className="w-32 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg">
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="preparing">Preparando</SelectItem>
                      <SelectItem value="ready">Listo</SelectItem>
                      <SelectItem value="sent">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de detalles de pedido */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Pedido #{formatOrderNumber(selectedOrder.order_number)}
                </DialogTitle>
                <DialogDescription>
                  Detalles completos del pedido y opciones para cambiar el
                  estado
                </DialogDescription>
              </DialogHeader>

              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePrintTicket(selectedOrder)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir ticket 80mm
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Estado del Pedido</h4>
                    <Badge variant={getStatusColor(selectedOrder.status)}>
                      {getStatusText(selectedOrder.status)}
                    </Badge>
                  </div>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) =>
                      updateOrderStatus(selectedOrder.id, value)
                    }
                    disabled={isUpdating === selectedOrder.id}
                  >
                    <SelectTrigger className="w-40 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg">
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="preparing">Preparando</SelectItem>
                      <SelectItem value="ready">Listo</SelectItem>
                      <SelectItem value="sent">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Cliente</h4>
                    <p>{selectedOrder.customer_name}</p>
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4" />
                        <a
                          href={`https://wa.me/${selectedOrder.customer_phone}`}
                          className="text-primary hover:underline"
                        >
                          {selectedOrder.customer_phone}
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Entrega</h4>
                    <p>
                      {selectedOrder.delivery_type === "pickup"
                        ? "Retiro en Local"
                        : "Delivery"}
                    </p>
                    {selectedOrder.delivery_address && (
                      <div className="flex items-start gap-2 mt-1">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span className="text-sm">
                          {selectedOrder.delivery_address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Productos</h4>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 p-2 bg-muted rounded"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.products.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(item.unit_price)} x {item.quantity}
                            </p>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(item.total_price)}
                          </span>
                        </div>
                        {getSelectedOptionsSummary(item.selected_options, item.products).length > 0 && (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {getSelectedOptionsSummary(item.selected_options, item.products).map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-accent">
                      {formatCurrency(selectedOrder.total ?? 0)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Pago</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Método: {getPaymentMethodText(selectedOrder.payments)}
                    </span>
                    <Badge
                      variant={
                        selectedOrder.payment_status === "completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedOrder.payment_status === "completed"
                        ? "Pagado"
                        : "Pendiente"}
                    </Badge>
                  </div>
                </div>

                {selectedOrder.delivery_notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notas</h4>
                    <p className="text-sm bg-accent text-white p-2 rounded">
                      {selectedOrder.delivery_notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de WhatsApp */}
      <Dialog
        open={whatsappModal.isOpen}
        onOpenChange={(open) =>
          setWhatsappModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Mensaje de WhatsApp Generado
            </DialogTitle>
            <DialogDescription>
              El mensaje se ha generado automáticamente. Haz clic en el botón
              para enviarlo al cliente.
            </DialogDescription>
          </DialogHeader>

          {whatsappModal.order && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Cliente:</h4>
                <p className="text-sm">
                  {whatsappModal.order.customer_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {whatsappModal.order.customer_phone}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Mensaje:</h4>
                <div className="bg-muted p-3 rounded-lg text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {whatsappModal.message}
                </div>
              </div>

              {whatsappModal.link && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      window.open(whatsappModal.link!, "_blank")
                      setWhatsappModal((prev) => ({
                        ...prev,
                        isOpen: false,
                      }))
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enviar por WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setWhatsappModal((prev) => ({
                        ...prev,
                        isOpen: false,
                      }))
                    }
                  >
                    Cerrar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
})
