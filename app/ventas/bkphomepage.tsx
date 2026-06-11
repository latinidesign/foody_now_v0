import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Store,
  MessageCircle,
  CreditCard,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Heart,
  CheckCircle,
  ArrowRight,
  Smartphone,
  BarChart3,
} from "lucide-react"

export const revalidate = 0 // sin cache mientras desarrollás

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex shrink-0 items-center">
                <Image
                  src="/foodynow_logo-wt.svg"
                  alt="FOODYNOW"
                  width={100}
                  height={45}
                  className="h-10 w-auto"
                  priority
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
              <Link href="/subscriptions">
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white">
                  <Store className="w-4 h-4 mr-2" />
                  Quiero mi tienda
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-fuchsia-50 to-lime-50 py-16 md:py-24 lg:py-32 xl:py-48">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="text-center lg:text-left">
              <Badge className="mb-6 bg-accent text-accent-foreground border-accent">
                🚀 Revoluciona tu negocio alimentario
              </Badge>
              <h2 className="text-4xl md:text-6xl font-light mb-6 text-foreground text-balance font-heading">
                <span className="font-bold text-lime-600">FOODYNOW</span>
                <sup>®</sup> la solución moderna para una comercialización más eficiente.
              </h2>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                {"TU TIENDA ONLINE conversacional. \nCon pagos garantizados por MercadoPago, la prestigiosa comunicación de WhatsApp, con carrito inteligente y notificaciones automáticas."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/subscriptions">
                  <Button size="lg" className="text-lg px-8 py-4 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Store className="w-5 h-5 mr-2" />
                    Comenzá ahora
                  </Button>
                </Link>
                <Link href="#beneficios">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-4 bg-transparent">
                    Ver beneficios
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex justify-center items-center">
              <Image
                alt="FoodyNow Presentacion"
                src="/mobile-header.png"
                width={600}
                height={800}
                className="object-contain w-full h-auto max-w-md rounded-xl bg-gray-900/5 shadow-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problema Section */}
      <section className="py-20 bg-fuchsia-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h3 className="text-3xl mb-6 font-heading text-light font-normal">¿Por qué elegir FOODYNOW?</h3>
            <p className="text-lg text-muted-foreground text-pretty">
              En un entorno comercial dinámico, la eficiencia y la adaptabilidad son clave para el éxito, es por ello que, FOODYNOW surge como una solución innovadora y profesional para negocios que buscan optimizar su estrategia de comercialización aprovechando las últimas tecnologías digitales. Esto permite:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center p-6">
              <TrendingUp className="w-12 h-12 text-accent mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Optimizar la experiencia del cliente</h4>
              <p className="text-sm text-muted-foreground">
                ofrecer una experiencia de compra personalizada y eficiente aumenta la satisfacción y la fidelidad.
              </p>
            </Card>

            <Card className="text-center p-6">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Aumentar la eficiencia operativa</h4>
              <p className="text-sm text-muted-foreground">
                Automatizar procesos de venta y gestión de clientes, libera tiempo para enfocarte en hacer crecer tu negocio y disponer de las herramientas de marketing digital.
              </p>
            </Card>

            <Card className="text-center p-6">
              <Zap className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Experiencia personalizada</h4>
              <p className="text-sm text-muted-foreground">
                Ofrece una experiencia adaptada que aumenta la satisfacción y fidelidad del cliente
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solución Section */}
      <section id="beneficios" className="py-20 bg-lime-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h3 className="text-4xl font-bold mb-6">FOODYNOW está diseñado para atender a Pymes, Micro Pymes, artesanos y profesionales de la gastronomía con sus especialidades y exquisiteces.</h3>
            <p className="text-lg text-muted-foreground text-pretty">
              Todo el proceso de compra se realiza de forma automática, sin intervención humana: desde el primer contacto telefónico, el sistema permite que el usuario recorra todas las categorías, vea todos los productos y sus especificaciones con sus precios, vea ofertas del día y reciba sugerencias de productos más vendidos de la última semana. Luego el usuario decide si quiere que su pedido sea entregado a domicilio o retirado en el local. Al cerrar el pedido, se emite automáticamente enlace de pago de MercadoPago; se confirma el pago y, finalmente, se envía al usuario la confirmación de la recepción del pedido pagado, junto con el tiempo estimado de entrega.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Ventas automatizadas por WhatsApp</h4>
                  <p className="text-muted-foreground">
                    Gestiona pedidos, consultas y ventas directamente desde WhatsApp con respuestas automáticas
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Pagos seguros con MercadoPago</h4>
                  <p className="text-muted-foreground">
                    Facilita a tus clientes realizar pagos de manera segura sin salir de la aplicación.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Marketing digital y CRM integrado</h4>
                  <p className="text-muted-foreground">
                    Gestiona relaciones con clientes y optimiza estrategias con herramientas profesionales
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8">
              <div className="bg-card rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="w-8 h-8 text-primary" />
                  <h3 className="font-semibold">Tu tienda móvil</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Catálogo de productos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Lista de Pedidos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Pagos integrados</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Notificaciones automáticas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valor Diferencial Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h3 className="text-4xl font-bold mb-6">¿Por qué elegir FOODYNOW?</h3>
            <p className="text-lg text-muted-foreground">
              Nos comprometemos a apoyar el crecimiento de tu negocio con beneficios únicos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center p-8 border-2 hover:border-accent/50 transition-colors">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Soporte publicitario completo</h4>
              <p className="text-muted-foreground">
                Te ayudamos a promocionar tu negocio y aumentar tu visibilidad con estrategias probadas
              </p>
            </Card>

            <Card className="text-center p-8 border-2 hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Sin comisiones</h4>
              <p className="text-muted-foreground">
                No cobramos comisiones por transacciones. Maximiza tus ganancias con cada venta
              </p>
            </Card>

            <Card className="text-center p-8 border-2 hover:border-secondary/50 transition-colors">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-secondary" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Fidelización de clientes</h4>
              <p className="text-muted-foreground">
                Herramientas especializadas para mejorar la retención y aumentar la lealtad de tus clientes
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Razones Profesionales Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-6">Razones profesionales para usar FOODYNOW</h3>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Moderniza tu estrategia comercial y lleva tu negocio al siguiente nivel
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Optimiza tu estrategia comercial</h4>
                    <p className="text-muted-foreground">
                      Llega a tus clientes de manera más directa y eficiente con herramientas modernas
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Aumenta alcance y eficiencia</h4>
                    <p className="text-muted-foreground">
                      Automatiza ventas y gestiona clientes con herramientas profesionales de marketing
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Personaliza la experiencia</h4>
                    <p className="text-muted-foreground">
                      Ofrece experiencias adaptadas a las necesidades de tus clientes en su plataforma favorita
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary to-secondary p-8 rounded-2xl text-white">
                <h4 className="text-2xl font-bold mb-6">¿Listo para transformar tu negocio?</h4>
                <p className="mb-6 opacity-90">
                  Únete a cientos de comercios que ya están modernizando su estrategia de comercialización con FOODYNOW
                  y aumentando sus ventas.
                </p>
                <Link href="/subscriptions">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full">
                    <Store className="w-5 h-5 mr-2" />
                    Quiero mi tienda ahora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto text-white">
            <h3 className="text-4xl font-bold mb-6">FOODYNOW es la solución para negocios que buscan el futuro</h3>
            <p className="text-xl mb-8 opacity-90">
              Moderniza tu estrategia de comercialización, mejora la eficiencia y aumenta las ventas aprovechando
              WhatsApp y las herramientas de marketing digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/subscriptions">
                <Button size="lg" className="text-lg px-8 py-4 bg-white text-primary hover:bg-white/90">
                  <Store className="w-5 h-5 mr-2" />
                  Quiero mi tienda
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 border-white text-white hover:bg-white/10 bg-transparent"
                >
                  Ya tengo cuenta
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
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-primary">FOODYNOW</span>
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
              <Link href="/contact" className="hover:text-primary">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
