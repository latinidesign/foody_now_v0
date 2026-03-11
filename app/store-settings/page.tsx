"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload } from "lucide-react"

export default function StoreSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [store, setStore] = useState<any | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    logoUrl: "",
    headerImageUrl: "",
    deliveryRadius: "5",
    deliveryFee: "0",
    minOrderAmount: "0",
  })

  useEffect(() => {
    let mounted = true

    const loadStore = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/auth/login")
        return
      }

      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle()

      if (!mounted) return

      if (storeData) {
        setStore(storeData)
        setFormData({
          name: storeData.name || "",
          description: storeData.description || "",
          phone: storeData.phone || "",
          email: storeData.email || "",
          address: storeData.address || "",
          logoUrl: storeData.logo_url || "",
          headerImageUrl: storeData.header_image_url || "",
          deliveryRadius: storeData.delivery_radius?.toString() || "5",
          deliveryFee: storeData.delivery_fee?.toString() || "0",
          minOrderAmount: storeData.min_order_amount?.toString() || "0",
        })
      }

      setLoading(false)
    }

    loadStore()

    return () => {
      mounted = false
    }
  }, [router])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "headerImageUrl") => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData({
          ...formData,
          [field]: event.target?.result as string,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("No hay sesión activa")
        setSaving(false)
        return
      }

      const updateData = {
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        logo_url: formData.logoUrl,
        header_image_url: formData.headerImageUrl,
        delivery_radius: Number.parseFloat(formData.deliveryRadius),
        delivery_fee: Number.parseFloat(formData.deliveryFee),
        min_order_amount: Number.parseFloat(formData.minOrderAmount),
      }

      if (store) {
        // Actualizar tienda existente
        const { error: updateError } = await supabase
          .from("stores")
          .update(updateData)
          .eq("id", store.id)

        if (updateError) throw updateError
        setSuccess("Configuración de tienda actualizada correctamente")
      } else {
        // No debería pasar, pero por si acaso
        setError("No se encontró tienda")
      }
    } catch (err) {
      console.error("Error saving store settings:", err)
      setError(err instanceof Error ? err.message : "Error al guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            No se encontró información de la tienda. Por favor completa el onboarding primero.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Tienda</h1>
        <p className="text-muted-foreground">Gestiona la información y configuración de tu tienda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-300">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la tienda</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={saving}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Imágenes */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <div className="flex gap-4">
                {formData.logoUrl && (
                  <img
                    src={formData.logoUrl}
                    alt="Logo"
                    className="h-20 w-20 object-cover rounded border"
                  />
                )}
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "logoUrl")}
                  disabled={saving}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("logo")?.click()}
                  disabled={saving}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir logo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="header">Imagen de encabezado</Label>
              <div className="flex gap-4">
                {formData.headerImageUrl && (
                  <img
                    src={formData.headerImageUrl}
                    alt="Header"
                    className="h-20 w-full max-w-xs object-cover rounded border"
                  />
                )}
                <input
                  id="header"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "headerImageUrl")}
                  disabled={saving}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("header")?.click()}
                  disabled={saving}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir encabezado
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de delivery */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryRadius">Radio de entrega (km)</Label>
              <Input
                id="deliveryRadius"
                type="number"
                value={formData.deliveryRadius}
                onChange={(e) => setFormData({ ...formData, deliveryRadius: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryFee">Costo de delivery ($)</Label>
              <Input
                id="deliveryFee"
                type="number"
                step="0.01"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderAmount">Compra mínima ($)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                step="0.01"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </form>
    </div>
  )
}
