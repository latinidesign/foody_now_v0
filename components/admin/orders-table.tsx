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
import { Eye, Phone, MapPin, Search, X } from "lucide-react"
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
      case "delivered":
        return "Entregado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId)
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) throw error

      toast.success("Estado del pedido actualizado")
      router.refresh()
    } catch (error) {
      console.error("Error updating order status:", error)
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
    </Card>
  )
}
