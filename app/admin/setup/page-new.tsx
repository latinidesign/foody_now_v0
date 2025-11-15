"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthHeader } from "@/components/auth/auth-header"
import { Store, Check, CreditCard, ArrowRight, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminSetupPage() {
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
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
      
      // Verificar si ya tiene suscripción activa
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trial'])
        .single()
        
      if (subscription) {
        // Ya tiene suscripción, redirigir a settings
        router.push('/admin/settings')
      }
    }
    
    checkUser()
  }, [router])

  const handleMercadoPagoSubscription = async () => {
    if (!user) return
    
    setIsCreatingSubscription(true)
    setError(null)

    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Redirigiendo a MercadoPago...")
        // Redirigir a MercadoPago
        window.location.href = data.checkout_url
      } else {
        throw new Error(data.error || "Error creando suscripción")
      }

    } catch (error: unknown) {
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
      <AuthHeader />

      <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-4 md:p-6">
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
                Activá la suscripción y comenzá tu prueba gratuita para explorar todas las funciones sin compromiso.
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 px-8">
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
                      De no hacerlo, se iniciará el cobro de la suscripción mensual por el medio seleccionado.
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
                className="w-full text-lg py-6 bg-gradient-to-r from-fuchsia-600 to-lime-600 hover:from-fuchsia-700 hover:to-lime-700 text-white shadow-lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {isCreatingSubscription ? "Procesando..." : "Suscribite ahora!"}
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
