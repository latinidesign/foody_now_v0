"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, Check, CreditCard, ArrowRight, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminSetupPage() {
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [planInfo, setPlanInfo] = useState<any>(null)
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
      
      // Cargar información del plan
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id, price, trial_period_days, display_name, currency')
        .eq('name', 'basic_monthly')
        .eq('is_active', true)
        .single()
      
      if (plan) {
        setPlanInfo(plan)
      }
      
      // Primero obtener la tienda del usuario
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id) // ← Cambiar de user_id a owner_id
        .maybeSingle()
      
      if (store) {
        // Verificar si ya tiene suscripción activa usando el store_id correcto
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('store_id', store.id)
          .in('status', ['active', 'trial'])
          .maybeSingle()
          
        if (subscription) {
          // Ya tiene suscripción, redirigir a settings
          router.push('/admin/settings')
        }
      }
    }
    
    checkUser()
  }, [router])

  const handleMercadoPagoSubscription = async () => {
    if (!user) return
    
    setIsCreatingSubscription(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Obtener o crear la tienda del usuario automáticamente
      let { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id) // ← Cambiar de user_id a owner_id
        .maybeSingle()

      // Si no existe la tienda, crearla automáticamente
      if (!store) {
        const { data: newStore, error: createStoreError } = await supabase
          .from('stores')
          .insert({
            owner_id: user.id, // ← Cambiar de user_id a owner_id
            name: `Mi Tienda FoodyNow`,
            slug: `tienda-${Date.now()}`, // Slug único temporal
            description: "Mi nueva tienda virtual",
            phone: "",
            address: "",
            is_active: false // ← Eliminar status, solo usar is_active
          })
          .select('id')
          .single()

        if (createStoreError) {
          throw new Error("Error creando la tienda: " + createStoreError.message)
        }
        
        store = newStore
        console.log("✅ Tienda creada automáticamente:", store.id)
      }

      if (storeError && storeError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error("Error consultando la tienda: " + storeError.message)
      }

      if (!store) {
        throw new Error("No se pudo crear la tienda")
      }
      
      // Obtener el plan mensual con información completa
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, price, trial_period_days, display_name')
        .eq('name', 'basic_monthly')
        .eq('is_active', true)
        .single()
      
      if (planError || !plan) {
        throw new Error("Plan de suscripción no disponible")
      }

      // Crear suscripción con los datos requeridos
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: store.id,
          planId: plan.id,
          payerEmail: user.email
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Redirigiendo a MercadoPago...")
        window.location.href = data.init_point
      } else {
        throw new Error(data.error || "Error creando suscripción")
      }

    } catch (error: unknown) {
      console.error("Error en suscripción:", error)
      setError(error instanceof Error ? error.message : "Error creando suscripción")
      toast.error("Error al procesar la suscripción")
    } finally {
      setIsCreatingSubscription(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fuchsia-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-[calc(100vh-100px)] w-full items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-2xl">
          <Card className="relative overflow-hidden border-2 border-fuchsia-200 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-lime-500/5"></div>
            
            <CardHeader className="text-center relative z-10">
              <div className="w-16 h-16 bg-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-fuchsia-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-fuchsia-600 mb-2">
                ¡Bienvenido a FOODYNOW! 🎉
              </CardTitle>
              <CardDescription className="text-lg">
                Activá la suscripción y comenzá tu prueba gratuita de {planInfo?.trial_period_days || 14} días para explorar todas las funciones sin compromiso.
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 px-8">
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-emerald-800 mb-2">FoodyNow - Tienda Now</h3>
                  <div className="text-3xl font-bold text-emerald-600 mb-1">
                    $ {planInfo?.price ? planInfo.price.toLocaleString() : '36.000'}
                  </div>
                  <p className="text-sm text-emerald-700">
                    por mes • {planInfo?.trial_period_days || 14} días de prueba gratis
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Creá tu tienda online personalizada</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Gestioná categorías, productos y precios</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Sin límites de productos o pedidos</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Notificaciones automáticas a clientes</span>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 mb-1">Importante:</p>
                    <p className="text-sm text-amber-700">
                      Podés cancelar la suscripción antes de finalizar el período de prueba sin costo alguno. 
                      De no hacerlo, se iniciará el cobro de la suscripción mensual automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="relative z-10 pt-0 pb-8">
              <Button 
                onClick={handleMercadoPagoSubscription}
                disabled={isCreatingSubscription}
                size="lg"
                className="w-full text-lg py-6 bg-gradient-to-r from-fuchsia-800 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-800 text-white shadow-lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {isCreatingSubscription ? "Procesando..." : "Iniciar Prueba Gratuita"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/auth/login" className="hover:text-primary underline">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
