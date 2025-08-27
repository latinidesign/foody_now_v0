"use client"

import type { Order } from "@/lib/types/database"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Phone, MapPin } from "lucide-react"

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
    // TODO: Implement status update
    console.log("Update order status:", orderId, newStatus)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Pedidos</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay pedidos aún</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">#{order.id.slice(-8)}</h3>
                    <Badge variant={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{order.customer_name}</p>
                      <p>{order.customer_phone}</p>
                    </div>
                    <div>
                      <p>{order.delivery_type === "pickup" ? "Retiro" : "Delivery"}</p>
                      <p>{new Date(order.created_at).toLocaleDateString("es-AR")}</p>
                    </div>
                    <div>
                      <p className="font-medium text-primary">${order.total}</p>
                      <p>{order.order_items.length} productos</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                      </DialogHeader>
                      {selectedOrder && (
                        <div className="space-y-4">
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
