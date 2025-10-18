"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import Script from "next/script"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CheckoutFormProps {
  store: Store
  mercadopagoPublicKey?: string | null
}

interface OrderData {
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryType: "pickup" | "delivery"
  deliveryAddress: string
  deliveryNotes: string
}

type CardTokenPayload = {
  cardNumber: string
  cardholderName: string
  expirationMonth: string
  expirationYear: string
  securityCode: string
  identificationType: string
  identificationNumber: string
}

interface MercadoPagoInstance {
  createCardToken: (cardTokenPayload: CardTokenPayload) => Promise<{ id?: string; [key: string]: unknown }>
  getPaymentMethods: (params: { bin: string }) => Promise<{ results?: Array<{ id?: string }> }>
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance
  }
}

export function CheckoutForm({ store, mercadopagoPublicKey }: CheckoutFormProps) {
  const { state, clearCart } = useCart()
  const router = useRouter()
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

  const [cardData, setCardData] = useState({
    cardholderName: "",
    cardNumber: "",
    expirationMonth: "",
    expirationYear: "",
    securityCode: "",
    identificationType: "DNI",
    identificationNumber: "",
    installments: "1",
  })
  const [mercadoPagoLoaded, setMercadoPagoLoaded] = useState(false)
  const [mercadoPagoClient, setMercadoPagoClient] = useState<MercadoPagoInstance | null>(null)
  const [sdkError, setSdkError] = useState<string | null>(null)

  const updateCardData = (field: keyof typeof cardData, value: string) => {
    setCardData((prev) => ({ ...prev, [field]: value }))
  }

  const deliveryFee = orderData.deliveryType === "delivery" ? store.delivery_fee : 0
  const subtotal = state.total
  const total = subtotal + deliveryFee

  const paymentsConfigured = Boolean(mercadopagoPublicKey)
  const normalizedCardNumber = useMemo(() => cardData.cardNumber.replace(/\D/g, ""), [cardData.cardNumber])

  // Check minimum order amount for delivery
  const meetsMinimum = orderData.deliveryType === "pickup" || subtotal >= store.min_order_amount

  const isPaymentReady = paymentsConfigured && !!mercadoPagoClient && !sdkError
  const submitDisabled = loading || !meetsMinimum || !isPaymentReady

  useEffect(() => {
    if (typeof window !== "undefined" && window.MercadoPago) {
      setMercadoPagoLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!paymentsConfigured) {
      setMercadoPagoClient(null)
      setSdkError(null)
      return
    }

    if (!mercadoPagoLoaded) {
      return
    }

    if (typeof window === "undefined" || !window.MercadoPago) {
      setSdkError("No pudimos cargar Mercado Pago. Actualiza la página e intenta nuevamente.")
      return
    }

    try {
      const instance = new window.MercadoPago(mercadopagoPublicKey!, { locale: "es-AR" })
      setMercadoPagoClient(instance)
      setSdkError(null)
    } catch (err) {
      console.error("[checkout:mp:init]", err)
      setSdkError("No pudimos inicializar el pago con tarjeta. Intenta nuevamente en unos segundos.")
    }

    return () => {
      setMercadoPagoClient(null)
    }
  }, [mercadoPagoLoaded, mercadopagoPublicKey, paymentsConfigured])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!meetsMinimum) {
      setError(`El pedido mínimo para delivery es $${store.min_order_amount}`)
      setLoading(false)
      return
    }

    if (!paymentsConfigured) {
      setError("Esta tienda aún no configuró un medio de pago. Comunícate con el comercio para completar el pedido.")
      setLoading(false)
      return
    }

    if (!mercadoPagoClient) {
      setError("Estamos inicializando el formulario de pago. Espera un momento e intenta nuevamente.")
      setLoading(false)
      return
    }

    const requiredCardFields = [
      cardData.cardholderName,
      cardData.cardNumber,
      cardData.expirationMonth,
      cardData.expirationYear,
      cardData.securityCode,
      cardData.identificationNumber,
    ]

    if (requiredCardFields.some((value) => !value.trim())) {
      setError("Completa todos los datos de la tarjeta para continuar.")
      setLoading(false)
      return
    }

    const sanitizedCardNumber = normalizedCardNumber
    const sanitizedSecurityCode = cardData.securityCode.replace(/\D/g, "")
    const sanitizedDocNumber = cardData.identificationNumber.replace(/\D/g, "")
    const normalizedMonth = cardData.expirationMonth.replace(/\D/g, "").padStart(2, "0")
    let normalizedYear = cardData.expirationYear.replace(/\D/g, "")

    if (sanitizedCardNumber.length < 13) {
      setError("El número de tarjeta ingresado es inválido.")
      setLoading(false)
      return
    }

    if (normalizedMonth.length !== 2) {
      setError("Revisa el mes de vencimiento de la tarjeta.")
      setLoading(false)
      return
    }

    if (normalizedYear.length === 2) {
      normalizedYear = `20${normalizedYear}`
    }

    if (normalizedYear.length !== 4) {
      setError("Revisa el año de vencimiento de la tarjeta.")
      setLoading(false)
      return
    }

    let cardTokenId: string

    try {
      const tokenResponse = await mercadoPagoClient.createCardToken({
        cardNumber: sanitizedCardNumber,
        cardholderName: cardData.cardholderName.trim(),
        expirationMonth: normalizedMonth,
        expirationYear: normalizedYear,
        securityCode: sanitizedSecurityCode,
        identificationType: cardData.identificationType.trim() || "DNI",
        identificationNumber: sanitizedDocNumber,
      })

      if (!tokenResponse || typeof tokenResponse.id !== "string") {
        const tokenErrorMessage =
          typeof tokenResponse === "object" && tokenResponse && "message" in tokenResponse
            ? String((tokenResponse as { message?: unknown }).message)
            : "No pudimos validar la tarjeta. Verifica los datos e intenta nuevamente."
        throw new Error(tokenErrorMessage)
      }

      cardTokenId = tokenResponse.id
    } catch (tokenError) {
      console.error("[checkout:mp:token]", tokenError)
      const message =
        tokenError instanceof Error
          ? tokenError.message
          : "No pudimos validar la tarjeta. Verifica los datos e intenta nuevamente."
      setError(message)
      setLoading(false)
      return
    }

    let detectedPaymentMethodId: string | undefined

    if (sanitizedCardNumber.length >= 6) {
      try {
        const paymentMethodsResponse = await mercadoPagoClient.getPaymentMethods({ bin: sanitizedCardNumber.slice(0, 6) })
        detectedPaymentMethodId = paymentMethodsResponse.results?.[0]?.id || undefined
      } catch (paymentMethodError) {
        console.warn("[checkout:mp:payment-method]", paymentMethodError)
      }
    }

    try {
      // Crear la orden primero
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          items: state.items,
          orderData,
          subtotal,
          deliveryFee,
          total,
        }),
      })

      const orderPayload = await orderResponse.json()

      if (!orderResponse.ok || !orderPayload?.order_id) {
        throw new Error(orderPayload?.error ?? "No se pudo crear la orden")
      }

      const [firstName, ...restName] = orderData.customerName.trim().split(" ")
      const installmentsNumber = Number.parseInt(cardData.installments, 10)
      const normalizedInstallments = Number.isFinite(installmentsNumber) && installmentsNumber > 0 ? installmentsNumber : undefined

      const paymentResponse = await fetch("/api/payments/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderPayload.order_id,
          provider: "mercadopago",
          payment_source: {
            type: "card",
            token: cardTokenId,
            payment_method_id: detectedPaymentMethodId,
            installments: normalizedInstallments,
          },
          payer: {
            email: orderData.customerEmail,
            first_name: firstName,
            last_name: restName.join(" ") || undefined,
          },
          metadata: {
            delivery_type: orderData.deliveryType,
          },
        }),
      })

      const paymentPayload = await paymentResponse.json()

      if (!paymentResponse.ok || !paymentPayload?.payment_status) {
        throw new Error(paymentPayload?.error ?? "Error al procesar el pago")
      }

      const paymentStatus = String(paymentPayload.payment_status)

      clearCart()

      if (paymentStatus === "completed") {
        router.push(`/store/payment/success?order_id=${orderPayload.order_id}`)
      } else if (paymentStatus === "pending") {
        router.push(`/store/payment/pending?order_id=${orderPayload.order_id}`)
      } else {
        router.push(`/store/payment/failure?order_id=${orderPayload.order_id}`)
      }
    } catch (err) {
      console.error("[checkout:payment]", err)
      setError(err instanceof Error ? err.message : "Error al procesar el pedido. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script
        id="mercadopago-sdk"
        src="https://sdk.mercadopago.com/js/v2"
        strategy="lazyOnload"
        onLoad={() => setMercadoPagoLoaded(true)}
        onError={() => setSdkError("No pudimos cargar Mercado Pago. Actualiza la página e intenta nuevamente.")}
      />
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

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Detalles de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <img src="/mp_handshake.png" alt="Mercado Pago" className="h-8" />
            <div className="flex-1">
              <p className="font-medium">Pago seguro con Mercado Pago</p>
              <p className="text-sm text-muted-foreground">
                Tokenizamos los datos de tu tarjeta y solo compartimos la información necesaria con el comercio.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Ingresá los datos de tu tarjeta. Mercado Pago generará un token seguro automáticamente para completar el pago.
          </p>

          {!paymentsConfigured && (
            <Alert variant="destructive">
              <AlertDescription>
                Esta tienda aún no configuró un medio de pago activo. Comunícate con el comercio para finalizar tu pedido.
              </AlertDescription>
            </Alert>
          )}

          {sdkError && (
            <Alert variant="destructive">
              <AlertDescription>{sdkError}</AlertDescription>
            </Alert>
          )}

          {paymentsConfigured && (
            <div className="space-y-4">
              {!mercadoPagoClient && !sdkError && (
                <p className="text-sm text-muted-foreground">Cargando el formulario seguro de pago...</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Nombre en la tarjeta *</Label>
                <Input
                  id="cardholderName"
                  value={cardData.cardholderName}
                  onChange={(e) => updateCardData("cardholderName", e.target.value)}
                  placeholder="Como aparece en la tarjeta"
                  autoComplete="cc-name"
                  disabled={loading || !mercadoPagoClient}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número de tarjeta *</Label>
                <Input
                  id="cardNumber"
                  value={cardData.cardNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "")
                    const formatted = digits.replace(/(.{4})/g, "$1 ").trim()
                    updateCardData("cardNumber", formatted)
                  }}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  maxLength={23}
                  disabled={loading || !mercadoPagoClient}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expirationMonth">Mes *</Label>
                  <Input
                    id="expirationMonth"
                    value={cardData.expirationMonth}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 2)
                      updateCardData("expirationMonth", digits)
                    }}
                    inputMode="numeric"
                    autoComplete="cc-exp-month"
                    placeholder="MM"
                    maxLength={2}
                    disabled={loading || !mercadoPagoClient}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expirationYear">Año *</Label>
                  <Input
                    id="expirationYear"
                    value={cardData.expirationYear}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4)
                      updateCardData("expirationYear", digits)
                    }}
                    inputMode="numeric"
                    autoComplete="cc-exp-year"
                    placeholder="AAAA"
                    maxLength={4}
                    disabled={loading || !mercadoPagoClient}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="securityCode">Código de seguridad *</Label>
                  <Input
                    id="securityCode"
                    value={cardData.securityCode}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4)
                      updateCardData("securityCode", digits)
                    }}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="CVV"
                    maxLength={4}
                    disabled={loading || !mercadoPagoClient}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identificationType">Documento *</Label>
                  <Select
                    value={cardData.identificationType}
                    onValueChange={(value) => updateCardData("identificationType", value)}
                    disabled={loading || !mercadoPagoClient}
                  >
                    <SelectTrigger id="identificationType">
                      <SelectValue placeholder="Tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="CUIT">CUIT</SelectItem>
                      <SelectItem value="CUIL">CUIL</SelectItem>
                      <SelectItem value="CI">CI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identificationNumber">Número de documento *</Label>
                  <Input
                    id="identificationNumber"
                    value={cardData.identificationNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
                      updateCardData("identificationNumber", digits)
                    }}
                    inputMode="numeric"
                    placeholder="Solo números"
                    disabled={loading || !mercadoPagoClient}
                  />
                </div>
              </div>

              <div className="space-y-2 md:max-w-xs">
                <Label htmlFor="installments">Cuotas</Label>
                <Input
                  id="installments"
                  type="number"
                  min={1}
                  value={cardData.installments}
                  onChange={(e) => updateCardData("installments", e.target.value)}
                  disabled={loading || !mercadoPagoClient}
                />
                <p className="text-xs text-muted-foreground">Ingresa 1 para un pago único.</p>
              </div>
            </div>
          )}
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

      <Button type="submit" disabled={submitDisabled} className="w-full" size="lg">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Pagar con MercadoPago
      </Button>
      </form>
    </>
  )
}
