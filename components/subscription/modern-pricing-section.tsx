"use client"

import { Check, Store, Zap, Shield, TrendingUp, MessageCircle, CreditCard, BarChart3, Users, Smartphone, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface ModernPricingSectionProps {
  onSubscribe: (planId: string) => void
  isLoading?: boolean
}

export function ModernPricingSection({ onSubscribe, isLoading }: ModernPricingSectionProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-fuchsia-50 to-lime-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-accent text-accent-foreground border-accent">
              <Zap className="w-4 h-4 mr-1" />
              Potencia tu negocio
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground font-heading">
              ¡Cuenta creada exitosamente! <span className="text-lime-600">Ahora elige tu plan</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Comienza con 15 días gratis y accede a todas las herramientas profesionales de FoodyNow
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Pricing Card */}
            <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
              <div className="bg-gradient-to-r from-primary to-secondary p-1">
                <div className="bg-card">
                  <CardHeader className="text-center pb-8 pt-8">
                    <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                      <Store className="w-8 h-8 text-accent" />
                    </div>
                    <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">
                      <Zap className="h-3 w-3 mr-1" />
                      15 días GRATIS
                    </Badge>
                    <CardTitle className="text-3xl font-bold mb-2">Plan Profesional</CardTitle>
                    <CardDescription className="text-lg">Todo lo que necesitas para vender online</CardDescription>
                    <div className="mt-6">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold text-primary">$29.99</span>
                        <span className="text-muted-foreground">/mes</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Después del período de prueba</p>
                    </div>
                  </CardHeader>

                  <CardContent className="px-8 pb-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Columna 1 */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-primary" />
                          Ventas y Comunicación
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Tienda online personalizada con tu marca</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Ventas automatizadas por WhatsApp</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Catálogo ilimitado de productos</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Carrito de compras inteligente</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Notificaciones automáticas a clientes</span>
                          </div>
                        </div>

                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 pt-4">
                          <CreditCard className="w-5 h-5 text-primary" />
                          Pagos y Seguridad
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Integración con MercadoPago</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Pagos seguros y certificados</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Sin comisiones por transacción</span>
                          </div>
                        </div>
                      </div>

                      {/* Columna 2 */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          Marketing y Gestión
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Panel de administración completo</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Estadísticas de ventas en tiempo real</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Gestión de inventario y categorías</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Herramientas de marketing digital</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">CRM integrado para clientes</span>
                          </div>
                        </div>

                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 pt-4">
                          <Shield className="w-5 h-5 text-primary" />
                          Soporte y Extras
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Soporte técnico prioritario</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Actualizaciones automáticas</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-sm">Capacitación y onboarding</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Destacados adicionales */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Beneficios exclusivos del período de prueba
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-accent" />
                          <span className="text-sm">Clientes ilimitados</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-accent" />
                          <span className="text-sm">App móvil optimizada</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-accent" />
                          <span className="text-sm">Certificado SSL incluido</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent" />
                          <span className="text-sm">Velocidad optimizada</span>
                        </div>
                      </div>
                    </div>

                    {/* Información del trial */}
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">🎉 ¡Empezá tu prueba gratuita hoy!</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• 30 días completos para probar todas las funciones</li>
                        <li>• Sin compromiso - cancela cuando quieras</li>
                        <li>• Solo se cobrará después de los 30 días gratuitos</li>
                        <li>• Acceso inmediato a todas las herramientas profesionales</li>
                      </ul>
                    </div>
                  </CardContent>

                  <CardFooter className="flex-col gap-4 pb-8">
                    <Button
                      onClick={() => onSubscribe('trial')}
                      disabled={isLoading}
                      size="lg"
                      className="w-full text-lg py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
                    >
                      {isLoading ? (
                        "Procesando..."
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Comenzar Prueba Gratuita
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Cancela cuando quieras. Sin permanencia mínima.
                    </p>
                  </CardFooter>
                </div>
              </div>
            </Card>

            {/* Garantía */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 rounded-full border border-accent/20">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Garantía de satisfacción de 30 días</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
