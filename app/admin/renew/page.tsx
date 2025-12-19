"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, Check, CreditCard, ArrowRight, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function RenewSubscriptionPage() {
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      
      // Obtener la tienda del usuario
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (storeData) {
        setStore(storeData)
        
        // Verificar si ya tiene suscripción activa
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('store_id', storeData.id)
          .in('status', ['active', 'trial'])
          .maybeSingle()
          
        if (subscriptionData) {
          // Ya tiene suscripción activa, redirigir al dashboard
          toast.success('Tu suscripción ya está activa')
          router.push('/admin')
        } else {
          // Obtener suscripción más reciente para mostrar info
          const { data: lastSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('store_id', storeData.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          setSubscription(lastSubscription)
        }
      }
    }
    
    checkUser()
  }, [router])

  const handleRenewSubscription = async () => {
    if (!user || !store) return
    
    setIsCreatingSubscription(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Crear nueva suscripción (la API detectará automáticamente que NO debe tener trial)
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: store.id,
          planId: process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_WITHOUT_TRIAL_ID,
          payerEmail: user.email
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Redirigiendo a MercadoPago para renovar tu suscripción...")
        window.location.href = data.init_point
      } else {
        throw new Error(data.error || "Error renovando suscripción")
      }

    } catch (err) {
      console.error("Error al renovar suscripción:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      toast.error("Error al procesar la renovación")
    } finally {
      setIsCreatingSubscription(false)
    }
  }

  if (!user || !store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Renueva tu Suscripción</h1>
        <p className="text-muted-foreground">
          Tu suscripción ha expirado. Renovála para continuar usando FoodyNow.
        </p>
      </div>

      {/* Información sobre datos conservados */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="w-5 h-5" />
            Tu información está segura
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <p className="mb-4">
            Todos tus datos están guardados y seguros. Al renovar tu suscripción, recuperarás acceso inmediato a:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              <span>Todos tus productos y categorías</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              <span>Historial completo de ventas y pedidos</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              <span>Configuración de WhatsApp y MercadoPago</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              <span>Personalización de tu tienda</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Plan de renovación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Plan de Renovación
          </CardTitle>
          <CardDescription>
            Continúa disfrutando de todas las funciones de FoodyNow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Características del plan */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Características incluidas:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Catálogo ilimitado de productos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Gestión de pedidos en tiempo real</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Integración con WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Cobros con MercadoPago</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Panel de administración completo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Tienda online personalizable</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col justify-center items-center bg-primary/5 rounded-lg p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Precio mensual</p>
                <p className="text-4xl font-bold text-primary mb-1">$36.000</p>
                <p className="text-sm text-muted-foreground">ARS / mes</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Renovación automática mensual
                </p>
              </div>
            </div>
          </div>

          {/* Info de la tienda actual */}
          {subscription && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-sm">Información de tu última suscripción:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Estado:</span> {subscription.status}
                </div>
                <div>
                  <span className="font-medium">Fecha de creación:</span>{" "}
                  {new Date(subscription.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleRenewSubscription}
            disabled={isCreatingSubscription}
            className="w-full"
            size="lg"
          >
            {isCreatingSubscription ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Renovar Suscripción
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Al renovar, serás redirigido a MercadoPago para completar el pago de forma segura.
          </p>

          <div className="w-full text-center pt-4 border-t">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Volver al panel de administración
            </Link>
          </div>
        </CardFooter>
      </Card>

      {/* Información adicional */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base">¿Necesitas ayuda?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Si tienes alguna pregunta sobre tu suscripción o necesitas asistencia,
            no dudes en contactarnos por WhatsApp.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
