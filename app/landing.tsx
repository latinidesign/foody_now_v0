import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, Users, Smartphone, MessageCircle, CreditCard, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 dark:from-green-950/20 dark:to-orange-950/20">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-primary">Foody Now</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="outline">Iniciar Sesión</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Crear Cuenta</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Tu tienda online de <span className="text-primary">comida</span> en minutos
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Crea tu tienda online, gestiona productos, recibe pedidos y cobra con MercadoPago. Todo integrado con
            WhatsApp para una experiencia completa.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8 py-3">
                Crear Mi Tienda Gratis
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
                Ver Características
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Todo lo que necesitas para vender online</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Smartphone className="w-12 h-12 text-primary mb-4" />
                <CardTitle>PWA Instalable</CardTitle>
                <CardDescription>
                  Tu tienda funciona como una app móvil, instalable y con funcionalidad offline
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="w-12 h-12 text-green-500 mb-4" />
                <CardTitle>Integración WhatsApp</CardTitle>
                <CardDescription>
                  Notificaciones automáticas de pedidos y contacto directo con tus clientes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="w-12 h-12 text-blue-500 mb-4" />
                <CardTitle>Pagos con MercadoPago</CardTitle>
                <CardDescription>
                  Acepta tarjetas de crédito, débito y todos los medios de pago disponibles
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Store className="w-12 h-12 text-orange-500 mb-4" />
                <CardTitle>Gestión Completa</CardTitle>
                <CardDescription>
                  Panel administrativo para productos, categorías, pedidos y configuración
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-12 h-12 text-purple-500 mb-4" />
                <CardTitle>Multi-tenant</CardTitle>
                <CardDescription>Cada comercio tiene su propia tienda con subdominio personalizado</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-red-500 mb-4" />
                <CardTitle>Estadísticas</CardTitle>
                <CardDescription>Reportes de ventas, productos más vendidos y análisis de tu negocio</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">¿Listo para empezar a vender online?</h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Únete a cientos de comercios que ya están vendiendo con Foody Now
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8 py-3">
              Crear Mi Tienda Ahora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Foody Now</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Plataforma de ecommerce para el segmento alimentario</p>
        </div>
      </footer>
    </div>
  )
}
