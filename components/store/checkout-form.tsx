"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, CreditCard } from "lucide-react"
import { useCart } from "./cart-context"
import type { Store } from "@/lib/types/database"

interface CheckoutFormProps {
  store: Store
}

interface OrderData {
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryType: "pickup" | "delivery"
  deliveryAddress: string
  deliveryNotes: string
}

export function CheckoutForm({ store }: CheckoutFormProps) {
  const { state, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [orderData, setOrderData] = useState<OrderData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryType: "pickup",
    deliveryAddress: "",
    deliveryNotes: "",
  })

  const deliveryFee = orderData.deliveryType === "delivery" ? store.delivery_fee : 0
  const subtotal = state.total
  const total = subtotal + deliveryFee

  // Check minimum order amount for delivery
  const meetsMinimum = orderData.deliveryType === "pickup" || subtotal >= store.min_order_amount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!meetsMinimum) {
      setError(`El pedido mínimo para delivery es $${store.min_order_amount}`)
      setLoading(false)
      return
    }

    try {
      const paymentResponse = await fetch("/api/payments/create-preference", {

        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId: store.id,
          items: state.items,
          orderData,
          subtotal,
          deliveryFee,
          total,
        }),
      })

      if (!paymentResponse.ok) {
        throw new Error("Error al crear el pago")
      }

      const { initPoint, sessionId } = await paymentResponse.json()

      try {
        window.localStorage.setItem("foody_now.checkout_session", sessionId)
      } catch (storageError) {
        console.warn("No se pudo guardar la sesión de pago localmente", storageError)
      }

      clearCart()

      // Redirect to MercadoPago checkout
      window.location.href = initPoint
    } catch (err) {
      setError("Error al procesar el pedido. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nombre Completo *</Label>
              <Input
                id="customerName"
                value={orderData.customerName}
                onChange={(e) => setOrderData({ ...orderData, customerName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Teléfono *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={orderData.customerPhone}
                onChange={(e) => setOrderData({ ...orderData, customerPhone: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email *</Label>
            <Input
              id="customerEmail"
              type="email"
              value={orderData.customerEmail}
              onChange={(e) => setOrderData({ ...orderData, customerEmail: e.target.value })}
              placeholder="necesario@para-pago.com"
              required
            />
            <p className="text-xs text-muted-foreground">Requerido para el proceso de pago</p>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Options */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={orderData.deliveryType}
            onValueChange={(value: "pickup" | "delivery") => setOrderData({ ...orderData, deliveryType: value })}
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-3">
                  {/* Store icon is removed to avoid redeclaration */}
                  <div>
                    <p className="font-medium">Retiro en Local</p>
                    <p className="text-sm text-muted-foreground">Gratis - {store.address}</p>
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      ${deliveryFee} - Radio de {store.delivery_radius}km
                    </p>
                    {store.min_order_amount > 0 && (
                      <p className="text-sm text-muted-foreground">Pedido mínimo: ${store.min_order_amount}</p>
                    )}
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {orderData.deliveryType === "delivery" && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Dirección de Entrega *</Label>
                <Textarea
                  id="deliveryAddress"
                  value={orderData.deliveryAddress}
                  onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                  placeholder="Calle, número, piso, departamento, referencias..."
                  required
                />
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <Label htmlFor="deliveryNotes">Notas Adicionales (opcional)</Label>
            <Textarea
              id="deliveryNotes"
              value={orderData.deliveryNotes}
              onChange={(e) => setOrderData({ ...orderData, deliveryNotes: e.target.value })}
              placeholder="Instrucciones especiales, alergias, etc..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  ${item.price} x {item.quantity}
                </p>
              </div>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Envío:</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {!meetsMinimum && (
            <Alert>
              <AlertDescription>
                Faltan ${(store.min_order_amount - subtotal).toFixed(2)} para alcanzar el pedido mínimo de delivery.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Método de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <img src="/mp_handshake.png" alt="MercadoPago" className="h-8" />
            <div className="flex-1">
              <p className="font-medium">Pago seguro con MercadoPago</p>
              <p className="text-sm text-muted-foreground">Tarjetas de crédito, débito y más</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading || !meetsMinimum} className="w-full" size="lg">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Pagar con MercadoPago
      </Button>
    </form>
  )
}
