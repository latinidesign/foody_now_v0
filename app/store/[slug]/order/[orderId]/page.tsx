import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, MapPin, Store, Phone } from "lucide-react"
import Link from "next/link"

interface OrderPageProps {
  params: Promise<{ slug: string; orderId: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { slug, orderId } = await params
  const supabase = await createClient()

  // Get order with store and items
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      stores (name, phone, address),
      order_items (
        *,
        products (name, image_url)
      )
    `)
    .eq("id", orderId)
    .single()

  if (error || !order) {
    notFound()
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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-primary">¡Pedido Confirmado!</h1>
            </div>
            <p className="text-muted-foreground">Pedido #{order.id.slice(-8)}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Estado del Pedido</span>
              <Badge variant={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Pedido realizado el {new Date(order.created_at).toLocaleString("es-AR")}</span>
            </div>
            {order.estimated_delivery_time && (
              <div className="mt-2 text-sm">
                <p>Tiempo estimado: {order.estimated_delivery_time} minutos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Comercio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              <span className="font-medium">{order.stores.name}</span>
            </div>
            {order.stores.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <a href={`tel:${order.stores.phone}`} className="text-primary hover:underline">
                  {order.stores.phone}
                </a>
              </div>
            )}
            {order.stores.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm">{order.stores.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {order.delivery_type === "pickup" ? (
                <Store className="w-4 h-4 text-primary" />
              ) : (
                <MapPin className="w-4 h-4 text-primary" />
              )}
              <span className="font-medium">{order.delivery_type === "pickup" ? "Retiro en Local" : "Delivery"}</span>
            </div>
            <div>
              <p className="font-medium">Cliente: {order.customer_name}</p>
              <p className="text-sm text-muted-foreground">Teléfono: {order.customer_phone}</p>
              {order.customer_email && <p className="text-sm text-muted-foreground">Email: {order.customer_email}</p>}
            </div>
            {order.delivery_address && (
              <div>
                <p className="font-medium">Dirección:</p>
                <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
              </div>
            )}
            {order.delivery_notes && (
              <div>
                <p className="font-medium">Notas:</p>
                <p className="text-sm text-muted-foreground">{order.delivery_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="flex gap-3">
                {item.products.image_url && (
                  <img
                    src={item.products.image_url || "/placeholder.svg"}
                    alt={item.products.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{item.products.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    ${item.unit_price} x {item.quantity} = ${item.total_price}
                  </p>
                </div>
              </div>
            ))}

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.subtotal}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span>${order.delivery_fee}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">${order.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href={`/store/${slug}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              Volver a la Tienda
            </Button>
          </Link>
          {order.stores.phone && (
            <a href={`tel:${order.stores.phone}`} className="flex-1">
              <Button className="w-full">Contactar Comercio</Button>
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
