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
import { ModernPricingSection } from "@/components/subscription/modern-pricing-section"
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
const [step, setStep] = useState<'register' | 'email-confirmation' | 'subscription'>('subscription')
  const [newUserId, setNewUserId] = useState<string | null>(null)
  const [newStoreId, setNewStoreId] = useState<string | null>(null)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const router = useRouter()

  // Cargar planes de suscripción al montar el componente
  useEffect(() => {
    loadSubscriptionPlans()
  }, [])

  // Verificar si el usuario volvió después de confirmar email
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('confirmed') === 'true') {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user && user.email_confirmed_at) {
          // Usuario confirmado, crear tienda y pasar a suscripción
          setNewUserId(user.id)
          await createStoreAndProceedToSubscription(user.id, user.email!)
        }
      }
    }
    
    checkEmailConfirmation()
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
    
    // Verificar que el usuario esté autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      throw new Error("Usuario no autenticado correctamente")
    }
    
    // Crear slug único basado en el email
    const emailPrefix = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const slug = `${emailPrefix}-${randomSuffix}`
    
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        owner_id: userId,
        name: `Mi Tienda ${emailPrefix}`,
        slug: slug,
        description: 'Descripción de mi tienda - Configurar en el panel de administración',
        is_active: true
      })
      .select()
      .single()

    if (storeError) {
      console.error('Store error details:', storeError)
      throw new Error(`Error creando tienda: ${storeError.message}`)
    }

    return store
  }

  const createStoreAndProceedToSubscription = async (userId: string, userEmail: string) => {
    try {
      const store = await createStoreForUser(userId, userEmail)
      setNewStoreId(store.id)
      setStep('subscription')
      toast.success("¡Email confirmado! Ahora configuremos tu suscripción.")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error creando tienda")
    }
  }

  const handleResendEmail = async () => {
    if (!email) return
    
    setIsResendingEmail(true)
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        }
      })
      
      if (error) throw error
      
      toast.success("Email de confirmación reenviado")
    } catch (error: any) {
      toast.error(error.message || "Error reenviando email")
    } finally {
      setIsResendingEmail(false)
    }
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
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })
      
      if (authError) throw authError
      
      if (!authData.user) {
        throw new Error("Error creando usuario")
      }

      // 2. Guardar datos del usuario y pasar al paso de confirmación de email
      setNewUserId(authData.user.id)
      setStep('email-confirmation')
      
      toast.success("¡Cuenta creada! Revisa tu email para confirmar tu cuenta.")

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async (planId?: string) => {
    if (!newStoreId) {
      setError("Error: No se encontró la tienda")
      return
    }

    // Si no se especifica planId, buscar el plan de prueba
    let selectedPlan = plans.find(plan => plan.isTrial)
    
    if (!selectedPlan) {
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
          planId: selectedPlan.id,
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
        ) : step === 'email-confirmation' ? (
          // Paso 2: Confirmación de email
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">Confirma tu email</CardTitle>
                <CardDescription>
                  Te hemos enviado un enlace de confirmación a <strong>{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📧 Revisa tu bandeja de entrada</h4>
                  <p className="text-sm text-blue-700">
                    Haz clic en el enlace de confirmación en el email que acabamos de enviarte. 
                    Si no lo ves, revisa tu carpeta de spam.
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Después de confirmar tu email, volverás aquí automáticamente para continuar con la configuración de tu tienda.
                  </p>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Ya confirmé mi email
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={handleResendEmail}
                    disabled={isResendingEmail}
                    className="w-full"
                  >
                    {isResendingEmail ? "Reenviando..." : "Reenviar email de confirmación"}
                  </Button>
                </div>
                
                <div className="text-center">
                  <button 
                    onClick={() => setStep('register')}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    ← Volver al registro
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Paso 3: Suscripción con diseño moderno de FoodyNow
          <div className="w-full">
            {/* Sección de pricing moderna */}
            <ModernPricingSection 
              onSubscribe={handleSubscribe}
              isLoading={isCreatingSubscription}
            />
            
            {error && (
              <div className="max-w-md mx-auto mt-8 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
