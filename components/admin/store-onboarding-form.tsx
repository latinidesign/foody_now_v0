"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface StoreOnboardingFormProps {
  store: any | null
}

const SUBDOMAIN_REGEX = /^[a-z0-9_-]+$/

export function StoreOnboardingForm({ store }: StoreOnboardingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [validatingSubdomain, setValidatingSubdomain] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)

  const [formData, setFormData] = useState({
    name: store?.name || "",
    slug: store?.slug || "",
    description: store?.description || "",
    phone: store?.phone || "",
    email: store?.email || "",
  })

  const handleSlugChange = async (value: string) => {
    setFormData({ ...formData, slug: value })

    // No validar si el slug ya está fijo
    if (store?.slug) {
      return
    }

    if (!value.trim()) {
      setSubdomainAvailable(null)
      return
    }

    if (!SUBDOMAIN_REGEX.test(value)) {
      setSubdomainAvailable(false)
      return
    }

    setValidatingSubdomain(true)
    try {
      const supabase = getBrowserClient()
      const { data: existing } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", value)
        .maybeSingle()

      setSubdomainAvailable(!existing)
    } catch (err) {
      console.error("Error validating subdomain:", err)
    } finally {
      setValidatingSubdomain(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validar campos
      if (!formData.name.trim()) {
        setError("El nombre de la tienda es requerido")
        setLoading(false)
        return
      }

      if (!formData.slug.trim()) {
        setError("El subdominio es requerido")
        setLoading(false)
        return
      }

      if (!SUBDOMAIN_REGEX.test(formData.slug)) {
        setError("El subdominio solo puede contener letras minúsculas, números, guión y guión bajo")
        setLoading(false)
        return
      }

      if (subdomainAvailable === false) {
        setError("El subdominio no está disponible")
        setLoading(false)
        return
      }

      const supabase = getBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("No se pudo obtener la sesión del usuario")
        setLoading(false)
        return
      }

      // Si no existe tienda, crearla
      // Añadir 14 dias de prueba desde la creación mediante trial_ends_at
      if (!store) {
        const { data: newStore, error: createError } = await supabase
          .from("stores")
          .insert({
            owner_id: user.id,
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            phone: formData.phone,
            email: formData.email,
            is_active: true,
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días de prueba, en el futuro se podría hacer mediante un parámetro o configurar desde el admin
            is_onboarded: true,
            delivery_radius: 5,
            delivery_fee: 0,
            min_order_amount: 0,
          })
          .select("id")
          .single()

        if (createError) throw createError
        setSuccess("¡Tienda creada exitosamente!")
      } else {
        // Actualizar tienda existente
        const { error: updateError } = await supabase
          .from("stores")
          .update({
            name: formData.name,
            slug: formData.slug || store.slug,
            description: formData.description,
            phone: formData.phone,
            email: formData.email,
            is_onboarded: true,
          })
          .eq("id", store.id)

        if (updateError) throw updateError
        setSuccess("¡Configuración actualizada exitosamente!")
      }

      // Redirigir al admin después de 1 segundo
      setTimeout(() => {
        router.push("/admin")
      }, 1000)
    } catch (err) {
      console.error("Error saving store:", err)
      setError(err instanceof Error ? err.message : "Error al guardar la configuración")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {store ? "Completar configuración de tienda" : "Crear tu tienda"}
          </CardTitle>
        </CardHeader>
        <CardContent>
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

            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la tienda *</Label>
              <Input
                id="name"
                placeholder="Mi Tienda Online"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Subdominio (URL: {formData.slug || 'mi-tienda'}.foodynow.com.ar) *
                {store?.slug && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (No se puede cambiar después de crear la tienda)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="slug"
                  placeholder="mi-tienda"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={loading || store?.slug ? true : false}
                  required
                  pattern="[a-z0-9_-]+"
                  title="Solo letras minúsculas, números, guión y guión bajo"
                />
                {validatingSubdomain && (
                  <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
              {!store?.slug && subdomainAvailable === true && (
                <p className="text-sm text-green-600">✓ Subdominio disponible</p>
              )}
              {!store?.slug && subdomainAvailable === false && (
                <p className="text-sm text-red-600">✗ Subdominio no disponible</p>
              )}
              {!SUBDOMAIN_REGEX.test(formData.slug) && formData.slug && (
                <p className="text-sm text-red-600">
                  Solo letras minúsculas, números, guión y guión bajo
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción de la tienda</Label>
              <Textarea
                id="description"
                placeholder="Describe tu tienda, productos y servicios..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+54 9 11 1234 5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@tienda.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || (subdomainAvailable === false && !store?.slug)}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar y continuar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
