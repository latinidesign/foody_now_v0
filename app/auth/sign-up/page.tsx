"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { AuthHeader } from "@/components/auth/auth-header"
import { PricingCard } from "@/components/subscription/pricing-card"
import { FoodyNowInfo } from "@/components/subscription/foodynow-info"
import { toast } from "sonner"
import type { SubscriptionPlan } from "@/lib/types/subscription"

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [step, setStep] = useState<'register' | 'subscription'>('register')
  const [newUserId, setNewUserId] = useState<string | null>(null)
  const [newStoreId, setNewStoreId] = useState<string | null>(null)
  const router = useRouter()

  // Cargar planes de suscripción al montar el componente
  useEffect(() => {
    loadSubscriptionPlans()
  }, [])

  const loadSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans')
      const data = await response.json()
      
      if (data.success) {
        setPlans(data.plans)
      } else {
        console.error('Error loading plans:', data.error)
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error)
    }
  }

  const createStoreForUser = async (userId: string, userEmail: string) => {
    const supabase = createClient()
    
    // Crear slug único basado en el email
    const emailPrefix = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const slug = `${emailPrefix}-${randomSuffix}`
    
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        user_id: userId,
        name: `Mi Tienda ${emailPrefix}`,
        slug: slug,
        description: 'Descripción de mi tienda - Configurar en el panel de administración',
        is_active: true,
        subscription_status: 'trial' // Será actualizado por el trigger
      })
      .select()
      .single()

    if (storeError) {
      throw new Error(`Error creando tienda: ${storeError.message}`)
    }

    return store
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    try {
      // 1. Crear usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/admin`,
        },
      })
      
      if (authError) throw authError
      
      if (!authData.user) {
        throw new Error("Error creando usuario")
      }

      // 2. Crear tienda para el usuario
      const store = await createStoreForUser(authData.user.id, email)
      
      // 3. Pasar al paso de suscripción
      setNewUserId(authData.user.id)
      setNewStoreId(store.id)
      setStep('subscription')
      
      toast.success("¡Cuenta creada exitosamente! Ahora configuremos tu suscripción.")

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!newStoreId) {
      setError("Error: No se encontró la tienda")
      return
    }

    // Buscar el plan de prueba
    const trialPlan = plans.find(plan => plan.isTrial)
    
    if (!trialPlan) {
      setError("Error: Plan de prueba no disponible")
      return
    }

    setIsCreatingSubscription(true)
    setError(null)

    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: trialPlan.id,
          storeId: newStoreId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("¡Suscripción de prueba activada! Redirigiendo al panel de administración...")
        
        // Redirigir al admin después de un breve delay
        setTimeout(() => {
          router.push("/admin")
        }, 2000)
      } else {
        throw new Error(data.error || "Error creando suscripción")
      }

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error creando suscripción")
    } finally {
      setIsCreatingSubscription(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />

      <div className="flex min-h-[calc(100vh-80px)] w-full items-start justify-center p-4 md:p-6">
        {step === 'register' ? (
          // Paso 1: Registro
          <div className="w-full max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Información de FoodyNow */}
              <div className="space-y-6">
                <FoodyNowInfo />
              </div>

              {/* Formulario de registro */}
              <div className="flex flex-col justify-center">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Crear cuenta</CardTitle>
                    <CardDescription>
                      Registrate gratis y comienza tu prueba de 30 días
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignUp}>
                      <div className="flex flex-col gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="password">Contraseña</Label>
                          <Input
                            id="password"
                            type="password"
                            required
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="repeat-password">Confirmar contraseña</Label>
                          <Input
                            id="repeat-password"
                            type="password"
                            required
                            placeholder="Repetí tu contraseña"
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                          />
                        </div>
                        {error && (
                          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">
                            {error}
                          </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Creando cuenta..." : "Crear cuenta gratis"}
                        </Button>
                      </div>
                      <div className="mt-4 text-center text-sm">
                        ¿Ya tienes cuenta?{" "}
                        <Link href="/auth/login" className="underline underline-offset-4 text-primary">
                          Inicia sesión
                        </Link>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          // Paso 2: Suscripción
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">¡Cuenta creada exitosamente! 🎉</h1>
              <p className="text-muted-foreground">
                Ahora activemos tu período de prueba gratuito para comenzar a usar FoodyNow
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Resumen de beneficios */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">¿Qué obtienes con tu prueba gratuita?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="text-sm">30 días completamente gratis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="text-sm">Acceso a todas las funciones premium</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="text-sm">Productos y pedidos ilimitados</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="text-sm">WhatsApp Business integrado</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="text-sm">Soporte prioritario incluido</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="text-sm">Sin compromiso - cancela cuando quieras</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Después de tu prueba gratuita</h4>
                  <p className="text-sm text-blue-700">
                    Si decides continuar, tu suscripción será de solo $29.99/mes. 
                    No se realizará ningún cargo durante los primeros 30 días.
                  </p>
                </div>
              </div>

              {/* Plan de suscripción */}
              <div>
                <PricingCard 
                  onSubscribe={handleSubscribe}
                  isLoading={isCreatingSubscription}
                />
                
                {error && (
                  <div className="mt-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded p-3">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
