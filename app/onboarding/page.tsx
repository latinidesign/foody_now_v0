"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { AuthHeader } from "@/components/auth/auth-header"
import { CheckCircle, Clock, CreditCard, Store, ArrowRight, Sparkles } from "lucide-react"

export default function OnboardingPage() {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleMercadoPagoSubscription = async () => {
    setIsProcessing(true)
    try {
      // Crear suscripción a través de nuestra API
      const response = await fetch('/api/subscription/create-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error creando suscripción')
      }

      // Redirigir a MercadoPago para completar el pago
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error('No se recibió URL de pago')
      }
      
    } catch (error) {
      console.error("Error creating MercadoPago subscription:", error)
      alert(error instanceof Error ? error.message : 'Error creando suscripción')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-fuchsia-50">
      <AuthHeader />

      <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-2xl space-y-8">
          
          {/* Mensaje de Bienvenida */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-green-800">
              ¡Bienvenido a FOODYNOW! 🎉
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Tu cuenta está lista. Ahora podés elegir cómo continuar con tu tienda online.
            </p>
          </div>

          {/* Trial de 15 días */}
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm px-3 py-1">
                  <Clock className="w-4 h-4 mr-1" />
                  Prueba Gratis
                </Badge>
              </div>
              <CardTitle className="text-xl text-green-800">
                Probá FoodyNow por 15 días GRATIS
              </CardTitle>
              <CardDescription className="text-base">
                Comenzá tu prueba gratuita y explorá todas las funciones sin compromiso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Creá tu tienda online personalizada</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Recibí pedidos por WhatsApp automáticamente</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Gestioná productos, categorías y precios</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Sin límites de productos o pedidos</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Link href="/admin" className="w-full">
                  <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <Store className="w-5 h-5 mr-2" />
                    Empezar Trial Gratuito de 15 Días
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Suscripción con MercadoPago */}
          <Card className="border-2 border-fuchsia-200 bg-fuchsia-50/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Badge variant="secondary" className="bg-fuchsia-100 text-fuchsia-800 text-sm px-3 py-1">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Suscripción Premium
                </Badge>
              </div>
              <CardTitle className="text-xl text-fuchsia-800">
                Suscribite y accedé a todo
              </CardTitle>
              <CardDescription className="text-base">
                Activá tu suscripción mensual y comenzá a vender inmediatamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-fuchsia-800 mb-1">
                  $48.900
                  <span className="text-lg font-normal text-muted-foreground">/mes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sin permanencia • Cancelá cuando quieras
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-fuchsia-600 flex-shrink-0" />
                  <span className="text-sm">Todas las funciones del trial</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-fuchsia-600 flex-shrink-0" />
                  <span className="text-sm">Soporte técnico prioritario</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-fuchsia-600 flex-shrink-0" />
                  <span className="text-sm">Actualizaciones automáticas</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-fuchsia-600 flex-shrink-0" />
                  <span className="text-sm">Garantía de funcionamiento 24/7</span>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                  onClick={handleMercadoPagoSubscription}
                  disabled={isProcessing}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {isProcessing ? "Procesando..." : "Suscribirse con MercadoPago"}
                  {!isProcessing && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              ¿Tenés dudas? <Link href="/contact" className="text-green-600 hover:underline">Contactanos</Link>
            </p>
            <p className="text-xs text-muted-foreground">
              Podés cancelar tu suscripción en cualquier momento desde tu panel de administración.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
