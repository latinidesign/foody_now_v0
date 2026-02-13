"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Eye, EyeOff, Upload, MapPin, X, Plus } from "lucide-react"
import type { Store, StoreSettings } from "@/lib/types/database"
import { LocationMap } from "@/components/store/location-map"

interface StoreSettingsFormProps {
  store: Store
  settings: StoreSettings | null
  mp: string
  mp_account_id?: string
}

interface BusinessHours {
  [key: string]: {
    isOpen: boolean
    open1: string
    close1: string
    open2?: string
    close2?: string
  }
}

const DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
]

export function MpAlert() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="p-4 rounded-lg border border-green-300 bg-green-50 text-green-800">
      Mercado Pago se vinculó correctamente.
    </div>
  )
}

export function StoreSettingsForm({ store, settings, mp, mp_account_id }: StoreSettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showToken, setShowToken] = useState(false)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const headerFileRef = useRef<HTMLInputElement>(null)
  const galleryFileRef = useRef<HTMLInputElement>(null)

  const [storeData, setStoreData] = useState({
    name: store.name,
    description: store.description || "",
    extendedDescription: (store as any).extended_description || "",
    galleryImages: (store as any).gallery_images || [],
    phone: store.phone || "",
    email: store.email || "",
    address: store.address || "",
    logoUrl: store.logo_url || "",
    headerImageUrl: store.header_image_url || "",
    deliveryRadius: store.delivery_radius.toString(),
    deliveryFee: store.delivery_fee.toString(),
    minOrderAmount: store.min_order_amount.toString(),
  })

  const [paymentSettings, setPaymentSettings] = useState({
    mercadopagoAccessToken: settings?.mercadopago_access_token || "",
    mercadopagoPublicKey: settings?.mercadopago_public_key || "",
  })

  const [businessHours, setBusinessHours] = useState<BusinessHours>(() => {
    const defaultHours = DAYS.reduce(
      (acc, day) => ({
        ...acc,
        [day.key]: {
          isOpen: true,
          open1: "09:00",
          close1: "22:00",
          open2: "",
          close2: "",
        },
      }),
      {},
    )

    return settings?.business_hours ? { ...defaultHours, ...settings.business_hours } : defaultHours
  })

  const handleLogoUpload = async (file: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setStoreData({ ...storeData, logoUrl: base64 })
    }
    reader.readAsDataURL(file)
  }

  const handleHeaderUpload = async (file: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setStoreData({ ...storeData, headerImageUrl: base64 })
    }
    reader.readAsDataURL(file)
  }

  const handleGalleryUpload = async (files: FileList) => {
    const newImages = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        newImages.push(base64)
        if (newImages.length === files.length) {
          setStoreData({
            ...storeData,
            galleryImages: [...storeData.galleryImages, ...newImages],
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeGalleryImage = (index: number) => {
    const newImages = storeData.galleryImages.filter((_, i) => i !== index)
    setStoreData({ ...storeData, galleryImages: newImages })
  }

  const updateBusinessHours = (day: string, field: string, value: any) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

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
          extended_description: storeData.extendedDescription,
          gallery_images: storeData.galleryImages,
          logo_url: storeData.logoUrl,
          header_image_url: storeData.headerImageUrl,
          delivery_radius: Number.parseInt(storeData.deliveryRadius),
          delivery_fee: Number.parseFloat(storeData.deliveryFee),
          min_order_amount: Number.parseFloat(storeData.minOrderAmount),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)

        console.error("Store update failed:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        })
      }

      setSuccess("Configuración actualizada correctamente")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessHoursUpdate = async (e: React.FormEvent) => {
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
        body: JSON.stringify({
          business_hours: businessHours,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar horarios")
      }

      setSuccess("Horarios actualizados correctamente")
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
        <TabsTrigger value="extended">Información Ampliada</TabsTrigger>
        <TabsTrigger value="hours">Horarios</TabsTrigger>
        <TabsTrigger value="payments">Pagos</TabsTrigger>
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
                <Label htmlFor="description">Descripción Breve</Label>
                <Textarea
                  id="description"
                  value={storeData.description}
                  onChange={(e) => setStoreData({ ...storeData, description: e.target.value })}
                  placeholder="Descripción corta que aparecerá en el header de tu tienda"
                  rows={2}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logotipo de la Tienda</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="logoUrl"
                        type="url"
                        value={storeData.logoUrl}
                        onChange={(e) => setStoreData({ ...storeData, logoUrl: e.target.value })}
                        placeholder="https://ejemplo.com/logo.png"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={() => logoFileRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir
                      </Button>
                    </div>
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleLogoUpload(file)
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Logotipo que aparecerá en el header de tu tienda (recomendado: 100x100px)
                    </p>
                    {storeData.logoUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={storeData.logoUrl || "/placeholder.svg"}
                          alt="Vista previa del logotipo"
                          className="w-16 h-16 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setStoreData({ ...storeData, logoUrl: "" })}
                        >
                          Quitar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headerImageUrl">Imagen de Header</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="headerImageUrl"
                        type="url"
                        value={storeData.headerImageUrl}
                        onChange={(e) => setStoreData({ ...storeData, headerImageUrl: e.target.value })}
                        placeholder="https://ejemplo.com/header.jpg"
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={() => headerFileRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir
                      </Button>
                    </div>
                    <input
                      ref={headerFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleHeaderUpload(file)
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Imagen de fondo del header de tu tienda (recomendado: 800x200px)
                    </p>
                    {storeData.headerImageUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={storeData.headerImageUrl || "/placeholder.svg"}
                          alt="Vista previa del header"
                          className="w-full h-20 object-cover rounded-lg border max-w-xs"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setStoreData({ ...storeData, headerImageUrl: "" })}
                        >
                          Quitar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    value={storeData.address}
                    onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
                    className="flex-1"
                    placeholder="Ingresa la dirección completa de tu tienda"
                  />
                  <LocationMap address={storeData.address} storeName={storeData.name}>
                    <Button type="button" variant="outline" disabled={!storeData.address.trim()}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Ver Mapa
                    </Button>
                  </LocationMap>
                </div>
                <p className="text-xs text-muted-foreground">Dirección completa donde se encuentra tu tienda</p>
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

      <TabsContent value="extended">
        <Card>
          <CardHeader>
            <CardTitle>Información Ampliada</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStoreUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="extendedDescription">Descripción Ampliada</Label>
                <Textarea
                  id="extendedDescription"
                  value={storeData.extendedDescription}
                  onChange={(e) => setStoreData({ ...storeData, extendedDescription: e.target.value })}
                  placeholder="Cuéntanos más sobre tu negocio, su historia, visión, especialidades, etc."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Esta descripción aparecerá en una sección especial de tu tienda para que los clientes conozcan más
                  sobre tu negocio
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Galería de Fotos del Local</Label>
                  <Button type="button" variant="outline" onClick={() => galleryFileRef.current?.click()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Fotos
                  </Button>
                </div>

                <input
                  ref={galleryFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files
                    if (files) handleGalleryUpload(files)
                  }}
                />

                {storeData.galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {storeData.galleryImages.map((image: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Foto del local ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGalleryImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Sube fotos de tu local, ambiente, productos destacados, etc. Estas fotos ayudarán a los clientes a
                  conocer mejor tu negocio
                </p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Información Ampliada
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="hours">
        <Card>
          <CardHeader>
            <CardTitle>Horarios de Atención</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBusinessHoursUpdate} className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-gray-300 p-3 text-left font-medium">Día</th>
                      <th className="border border-gray-300 p-3 text-center font-medium">Abierto</th>
                      <th className="border border-gray-300 p-3 text-center font-medium">Abre</th>
                      <th className="border border-gray-300 p-3 text-center font-medium">Cierra</th>
                      <th className="border border-gray-300 p-3 text-center font-medium">Opcional - Abre</th>
                      <th className="border border-gray-300 p-3 text-center font-medium">Opcional - Cierra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day.key} className="hover:bg-muted/50">
                        <td className="border border-gray-300 p-3 font-medium">{day.label}</td>
                        <td className="border border-gray-300 p-3 text-center">
                          <Checkbox
                            checked={businessHours[day.key]?.isOpen}
                            onCheckedChange={(checked) => updateBusinessHours(day.key, "isOpen", checked)}
                          />
                        </td>
                        <td className="border border-gray-300 p-3">
                          <Input
                            type="time"
                            value={businessHours[day.key]?.open1 || "09:00"}
                            onChange={(e) => updateBusinessHours(day.key, "open1", e.target.value)}
                            disabled={!businessHours[day.key]?.isOpen}
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 p-3">
                          <Input
                            type="time"
                            value={businessHours[day.key]?.close1 || "22:00"}
                            onChange={(e) => updateBusinessHours(day.key, "close1", e.target.value)}
                            disabled={!businessHours[day.key]?.isOpen}
                            className="w-full"
                          />
                        </td>
                        <td className="border border-gray-300 p-3">
                          <Input
                            type="time"
                            value={businessHours[day.key]?.open2 || ""}
                            onChange={(e) => updateBusinessHours(day.key, "open2", e.target.value)}
                            disabled={!businessHours[day.key]?.isOpen}
                            className="w-full"
                            placeholder="Opcional"
                          />
                        </td>
                        <td className="border border-gray-300 p-3">
                          <Input
                            type="time"
                            value={businessHours[day.key]?.close2 || ""}
                            onChange={(e) => updateBusinessHours(day.key, "close2", e.target.value)}
                            disabled={!businessHours[day.key]?.isOpen}
                            className="w-full"
                            placeholder="Opcional"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Los horarios opcionales permiten configurar dos turnos en el mismo día (ej: mañana y noche)</p>
                <p>
                  • Para horarios que pasan de medianoche, usa formato 24h+ (ej: 01:00 para la 1:00 AM del día
                  siguiente)
                </p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Horarios
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
            {mp === "connected" ? (
              <div className="p-4 rounded-lg border border-green-300 bg-green-50 text-green-800">
                <p className="font-bold mb-4">¡Cuenta conectada correctamente!</p>
                <p className="text-sm">
                  Usuario MP ID: {mp_account_id}
                </p>
                <p className="text-sm mt-2">
                  Ya puedes empezar a recibir pagos a través de MercadoPago, directo a tu cuenta y sin comisiones. Si necesitas cambiar la cuenta vinculada,
                  puedes contactarte con administración para reiniciar el proceso de vinculación de cuenta.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-blue-300 bg-blue-50 text-blue-800">
                <p className="font-medium mb-10">Conectá tu cuenta de MercadoPago para empezar a cobrar con tu cuenta, automático y sin comisiones.</p>
                <a
                  href="/api/mp/connect"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Conectar MercadoPago
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
