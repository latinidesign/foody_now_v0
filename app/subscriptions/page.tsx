import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Store,
  Check,
  Zap,
  Shield,
  TrendingUp,
  MessageCircle,
  CreditCard,
  BarChart3,
  Users,
  Smartphone,
  ArrowRight,
} from "lucide-react"

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/foodynow_logo-wt.svg"
                alt="FOODYNOW"
                width={100}
                height={45}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-fuchsia-50 to-lime-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-accent text-accent-foreground border-accent">
              <Zap className="w-4 h-4 mr-1" />
              Potencia tu negocio
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground font-heading">
              Elige el plan perfecto para tu <span className="text-lime-600">negocio gastronómico</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Moderniza tu estrategia comercial con FOODYNOW y lleva tu negocio al siguiente nivel con herramientas
              profesionales
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
                    <CardTitle className="text-3xl font-bold mb-2">Plan Profesional</CardTitle>
                    <CardDescription className="text-lg">Todo lo que necesitas para vender online</CardDescription>
                    <div className="mt-6">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold text-primary">$9.999</span>
                        <span className="text-muted-foreground">/mes</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Sin comisiones por venta</p>
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
                            <span className="text-sm">Soporte publicitario completo</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Destacados adicionales */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Beneficios exclusivos
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
                  </CardContent>

                  <CardFooter className="flex-col gap-4 pb-8">
                    <Link href="/auth/sign-up" className="w-full">
                      <Button
                        size="lg"
                        className="w-full text-lg py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
                      >
                        <Store className="w-5 h-5 mr-2" />
                        Quiero mi tienda
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
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
                <span className="text-sm font-medium">Prueba gratuita de 15 días</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-fuchsia-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12 font-heading">Preguntas frecuentes</h3>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Hay costos adicionales?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No. El precio mensual incluye todo lo necesario para operar tu tienda online. No cobramos comisiones
                    por ventas ni hay costos ocultos.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Puedo cancelar en cualquier momento?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Sí, puedes cancelar tu suscripción en cualquier momento sin penalizaciones. No hay permanencia
                    mínima.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Qué métodos de pago aceptan?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Aceptamos todos los métodos de pago disponibles en MercadoPago: tarjetas de crédito, débito,
                    transferencias y efectivo en puntos de pago.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Necesito conocimientos técnicos?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No. FOODYNOW está diseñado para ser intuitivo y fácil de usar. Además, ofrecemos soporte técnico
                    para ayudarte en todo momento.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h3 className="text-4xl font-bold mb-6 font-heading">¿Listo para transformar tu negocio?</h3>
            <p className="text-xl mb-8 opacity-90">
              Únete a cientos de comercios que ya están modernizando su estrategia de comercialización con FOODYNOW
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="text-lg px-8 py-4 bg-white text-primary hover:bg-white/90">
                  <Store className="w-5 h-5 mr-2" />
                  Crear mi tienda ahora
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 border-white text-white hover:bg-white/10 bg-transparent"
                >
                  Ver más información
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image src="/foodynow_logo-wt.svg" alt="FOODYNOW" width={120} height={50} className="h-12 w-auto" />
            </div>
            <p className="text-muted-foreground mb-6">
              La plataforma moderna para comercialización eficiente en el segmento alimentario
            </p>
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-primary">
                Términos de Servicio
              </Link>
              <Link href="/privacy" className="hover:text-primary">
                Política de Privacidad
              </Link>
              <Link href="mailto:foodynow.ar@gmail.com" className="hover:text-primary">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
