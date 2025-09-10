"use client"

import type React from "react"

import { useState, useRef } from "react"
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
}

interface BusinessHours {
  [key: string]: {
    isOpen: boolean
    openTime: string
    closeTime: string
    hasBreak: boolean
    breakStart?: string
    breakEnd?: string
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

export function StoreSettingsForm({ store, settings }: StoreSettingsFormProps) {
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
          openTime: "09:00",
          closeTime: "22:00",
          hasBreak: false,
          breakStart: "13:00",
          breakEnd: "16:00",
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
        throw new Error("Error al actualizar la tienda")
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
              {DAYS.map((day) => (
                <div key={day.key} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">{day.label}</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={businessHours[day.key]?.isOpen}
                        onCheckedChange={(checked) => updateBusinessHours(day.key, "isOpen", checked)}
                      />
                      <Label className="text-sm">Abierto</Label>
                    </div>
                  </div>

                  {businessHours[day.key]?.isOpen && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Hora de Apertura</Label>
                          <Input
                            type="time"
                            value={businessHours[day.key]?.openTime || "09:00"}
                            onChange={(e) => updateBusinessHours(day.key, "openTime", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Hora de Cierre</Label>
                          <Input
                            type="time"
                            value={businessHours[day.key]?.closeTime || "22:00"}
                            onChange={(e) => updateBusinessHours(day.key, "closeTime", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={businessHours[day.key]?.hasBreak}
                          onCheckedChange={(checked) => updateBusinessHours(day.key, "hasBreak", checked)}
                        />
                        <Label className="text-sm">Horario cortado (descanso al mediodía)</Label>
                      </div>

                      {businessHours[day.key]?.hasBreak && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                          <div className="space-y-2">
                            <Label className="text-sm">Inicio del Descanso</Label>
                            <Input
                              type="time"
                              value={businessHours[day.key]?.breakStart || "13:00"}
                              onChange={(e) => updateBusinessHours(day.key, "breakStart", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Fin del Descanso</Label>
                            <Input
                              type="time"
                              value={businessHours[day.key]?.breakEnd || "16:00"}
                              onChange={(e) => updateBusinessHours(day.key, "breakEnd", e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

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
    </Tabs>
  )
}
