"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Eye, EyeOff } from "lucide-react"
import type { Store, StoreSettings } from "@/lib/types/database"

interface StoreSettingsFormProps {
  store: Store
  settings: StoreSettings | null
}

export function StoreSettingsForm({ store, settings }: StoreSettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showToken, setShowToken] = useState(false)

  const [storeData, setStoreData] = useState({
    name: store.name,
    description: store.description || "",
    phone: store.phone || "",
    email: store.email || "",
    address: store.address || "",
    deliveryRadius: store.delivery_radius.toString(),
    deliveryFee: store.delivery_fee.toString(),
    minOrderAmount: store.min_order_amount.toString(),
  })

  const [paymentSettings, setPaymentSettings] = useState({
    mercadopagoAccessToken: settings?.mercadopago_access_token || "",
    mercadopagoPublicKey: settings?.mercadopago_public_key || "",
    whatsappNumber: settings?.whatsapp_number || "",
  })

  const handleStoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/stores/${store.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...storeData,
          delivery_radius: Number.parseInt(storeData.deliveryRadius),
          delivery_fee: Number.parseFloat(storeData.deliveryFee),
          min_order_amount: Number.parseFloat(storeData.minOrderAmount),
        }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar la tienda")
      }

      setSuccess("Configuración actualizada correctamente")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/stores/${store.id}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentSettings),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar configuración de pagos")
      }

      setSuccess("Configuración de pagos actualizada correctamente")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="store" className="space-y-6">
      <TabsList>
        <TabsTrigger value="store">Tienda</TabsTrigger>
        <TabsTrigger value="payments">Pagos</TabsTrigger>
        <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
      </TabsList>

      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      <TabsContent value="store">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de la Tienda</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStoreUpdate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Tienda</Label>
                  <Input
                    id="name"
                    value={storeData.name}
                    onChange={(e) => setStoreData({ ...storeData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={storeData.phone}
                    onChange={(e) => setStoreData({ ...storeData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={storeData.description}
                  onChange={(e) => setStoreData({ ...storeData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={storeData.address}
                  onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryRadius">Radio de Entrega (km)</Label>
                  <Input
                    id="deliveryRadius"
                    type="number"
                    value={storeData.deliveryRadius}
                    onChange={(e) => setStoreData({ ...storeData, deliveryRadius: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryFee">Costo de Envío ($)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    value={storeData.deliveryFee}
                    onChange={(e) => setStoreData({ ...storeData, deliveryFee: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">Pedido Mínimo ($)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    step="0.01"
                    value={storeData.minOrderAmount}
                    onChange={(e) => setStoreData({ ...storeData, minOrderAmount: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payments">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de MercadoPago</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePaymentUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mercadopagoAccessToken">Access Token de MercadoPago</Label>
                <div className="relative">
                  <Input
                    id="mercadopagoAccessToken"
                    type={showToken ? "text" : "password"}
                    value={paymentSettings.mercadopagoAccessToken}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, mercadopagoAccessToken: e.target.value })}
                    placeholder="APP_USR-..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Obtén tu Access Token desde tu cuenta de MercadoPago</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mercadopagoPublicKey">Public Key de MercadoPago</Label>
                <Input
                  id="mercadopagoPublicKey"
                  value={paymentSettings.mercadopagoPublicKey}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, mercadopagoPublicKey: e.target.value })}
                  placeholder="APP_USR-..."
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración de Pagos
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePaymentUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">Número de WhatsApp</Label>
                <Input
                  id="whatsappNumber"
                  value={paymentSettings.whatsappNumber}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, whatsappNumber: e.target.value })}
                  placeholder="+54 11 1234-5678"
                />
                <p className="text-xs text-muted-foreground">Número donde recibirás las notificaciones de pedidos</p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
