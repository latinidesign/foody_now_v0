"use client"

import type { Order } from "@/lib/types/database"
import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, Phone, MapPin, Search, X, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { AnalyticsDateSelector } from "@/components/admin/analytics-date-selector"

interface OrderWithItems extends Order {
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    products: { name: string }
  }>
}

interface OrdersTableProps {
  orders: OrderWithItems[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all")
  const [whatsappModal, setWhatsappModal] = useState<{
    isOpen: boolean
    order: OrderWithItems | null
    message: string
    link: string | null
  }>({ isOpen: false, order: null, message: "", link: null })
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const filteredAndSortedOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const searchMatch =
        searchTerm === "" ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_items.some((item) => item.products.name.toLowerCase().includes(searchTerm.toLowerCase()))

      const statusMatch = statusFilter === "all" || order.status === statusFilter

      const deliveryMatch = deliveryFilter === "all" || order.delivery_type === deliveryFilter

      const orderDate = new Date(order.created_at).toISOString().split("T")[0]
      const dateFromMatch = !startDate || orderDate >= startDate
      const dateToMatch = !endDate || orderDate <= endDate

      return searchMatch && statusMatch && deliveryMatch && dateFromMatch && dateToMatch
    })

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [orders, searchTerm, statusFilter, deliveryFilter, startDate, endDate])

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
        return "default"
      case "preparing":
        return "default"
      case "ready":
        return "default"
      case "sent":
        return "default"
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

  const getWhatsAppMessage = (order: OrderWithItems, status: string) => {
    const storeName = "Pizzeria Don Mario" // Nombre de la tienda
    const orderItems = order.order_items.map(item => 
      `• ${item.quantity}x ${item.products.name}`
    ).join('\n')

    switch (status) {
      case "confirmed":
        return `🎉 *¡Pedido Confirmado!*

📦 Pedido: #${order.id.slice(-8)}
🏪 ${storeName}
👤 ${order.customer_name}

✅ *Tu pedido ha sido confirmado y está en proceso*

📋 *Resumen del pedido:*
${orderItems}

💰 Total: $${order.total.toLocaleString()}

⏰ *Tiempo estimado:* 30-45 minutos
📱 Te mantendremos informado del progreso.

¡Gracias por tu pedido!

---
*${storeName} - FoodyNow*`

      case "preparing":
        return `👨‍🍳 *¡Tu pedido se está preparando!*

📦 Pedido: #${order.id.slice(-8)}
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

📦 Pedido: #${order.id.slice(-8)}
🏪 ${storeName}
👤 ${order.customer_name}

✅ *Tu pedido está preparado y listo para retirar*

📋 *Tu pedido:*
${orderItems}

💰 Total: $${order.total.toLocaleString()}

📍 *Dirección para retirar:*
${order.delivery_address || 'Ver ubicación en la app'}

⏰ *Horario de retiro:*
Lun a Dom: 11:00 - 23:00

🚗 ¡Vení a retirarlo! Te esperamos.

¡Gracias por elegirnos!

---
*${storeName} - FoodyNow*`

      case "sent":
        return `🚴‍♂️ *¡Tu pedido está EN CAMINO!*

📦 Pedido: #${order.id.slice(-8)}
🏪 ${storeName}
👤 ${order.customer_name}

� *Nuestro repartidor está en camino hacia tu ubicación*

📋 *Tu pedido:*
${orderItems}

💰 Total: $${order.total.toLocaleString()}

📍 *Dirección de entrega:*
${order.delivery_address}

📱 Te contactaremos al llegar a tu puerta.
⏰ Tiempo estimado: 10-15 minutos

¡Gracias por tu paciencia!

---
*${storeName} - FoodyNow*`

      case "delivered":
        return `✅ *¡Pedido Entregado!*

📦 Pedido: #${order.id.slice(-8)}
🏪 ${storeName}
👤 ${order.customer_name}

🎉 *Tu pedido ha sido entregado exitosamente*

📋 *Pedido completado:*
${orderItems}

💰 Total: $${order.total.toLocaleString()}

⭐ *¿Cómo estuvo tu experiencia?*
Tu opinión nos ayuda a mejorar.

¡Esperamos verte pronto de nuevo!

---
*${storeName} - FoodyNow*`

      case "cancelled":
        return `❌ *Pedido Cancelado*

📦 Pedido: #${order.id.slice(-8)}
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

Pedido: #${order.id.slice(-8)}
Estado: ${getStatusText(status)}

¡Te mantendremos informado!

---
*${storeName} - FoodyNow*`
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId)
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) throw error

      // Buscar el pedido para enviar mensaje de WhatsApp
      const order = orders.find(o => o.id === orderId)
      if (order && order.customer_phone && newStatus !== 'pending') {
        // Generar mensaje automáticamente
        await sendWhatsAppMessage(order, newStatus)
      }

      toast.success("Estado del pedido actualizado")
      router.refresh()
    } catch (error) {
      console.error("Error updating order status:", error)
      toast.error("Error al actualizar el estado del pedido")
    } finally {
      setIsUpdating(null)
    }
  }

  const sendWhatsAppMessage = async (order: OrderWithItems, status: string) => {
    try {
      const message = getWhatsAppMessage(order, status)
      
      const response = await fetch(`/api/stores/${order.store_id}/whatsapp/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: order.customer_phone,
          message: message,
          strategy: 'text'
        })
      })

      const result = await response.json()
      
      if (result.whatsapp_link) {
        // Mostrar modal con el link de WhatsApp
        setWhatsappModal({
          isOpen: true,
          order: order,
          message: message,
          link: result.whatsapp_link
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

            {(searchTerm || statusFilter !== "all" || deliveryFilter !== "all" || startDate || endDate) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {filteredAndSortedOrders.length} de {orders.length} pedidos
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAndSortedOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {orders.length === 0 ? "No hay pedidos aún" : "No se encontraron pedidos con los filtros aplicados"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">#{order.id.slice(-8)}</h3>
                    <Badge variant={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                    <Badge variant="outline">{order.delivery_type === "pickup" ? "Retiro" : "Delivery"}</Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{order.customer_name}</p>
                      <p>{order.customer_phone}</p>
                    </div>
                    <div>
                      <p>{new Date(order.created_at).toLocaleDateString("es-AR")}</p>
                      <p>
                        {new Date(order.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-primary">${order.total}</p>
                      <p>{order.order_items.length} productos</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Pedido #{order.id.slice(-8)}</DialogTitle>
                        <DialogDescription>
                          Detalles completos del pedido y opciones para cambiar el estado
                        </DialogDescription>
                      </DialogHeader>
                      {selectedOrder && (
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
                              onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
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
                              <div className="flex items-center gap-2 mt-1">
                                <Phone className="w-4 h-4" />
                                <a
                                  href={`tel:${selectedOrder.customer_phone}`}
                                  className="text-primary hover:underline"
                                >
                                  {selectedOrder.customer_phone}
                                </a>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Entrega</h4>
                              <p>{selectedOrder.delivery_type === "pickup" ? "Retiro en Local" : "Delivery"}</p>
                              {selectedOrder.delivery_address && (
                                <div className="flex items-start gap-2 mt-1">
                                  <MapPin className="w-4 h-4 mt-0.5" />
                                  <span className="text-sm">{selectedOrder.delivery_address}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Productos</h4>
                            <div className="space-y-2">
                              {selectedOrder.order_items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                  <div>
                                    <p className="font-medium">{item.products.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      ${item.unit_price} x {item.quantity}
                                    </p>
                                  </div>
                                  <span className="font-medium">${item.total_price}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t font-bold">
                              <span>Total:</span>
                              <span className="text-primary">${selectedOrder.total}</span>
                            </div>
                          </div>

                          {selectedOrder.delivery_notes && (
                            <div>
                              <h4 className="font-semibold mb-2">Notas</h4>
                              <p className="text-sm bg-muted p-2 rounded">{selectedOrder.delivery_notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de WhatsApp */}
      <Dialog open={whatsappModal.isOpen} onOpenChange={(open) => 
        setWhatsappModal(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Mensaje de WhatsApp Generado
            </DialogTitle>
            <DialogDescription>
              El mensaje se ha generado automáticamente. Haz clic en el botón para enviarlo al cliente.
            </DialogDescription>
          </DialogHeader>
          
          {whatsappModal.order && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Cliente:</h4>
                <p className="text-sm">{whatsappModal.order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{whatsappModal.order.customer_phone}</p>
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
                      window.open(whatsappModal.link!, '_blank')
                      setWhatsappModal(prev => ({ ...prev, isOpen: false }))
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enviar por WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setWhatsappModal(prev => ({ ...prev, isOpen: false }))}
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
}
