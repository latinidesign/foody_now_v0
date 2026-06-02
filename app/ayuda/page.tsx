import Link from "next/link"
import { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Store,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Layers,
  Package,
  Printer,
  MessageCircle,
  BarChart3,
  Users,
  Settings,
  Rocket,
  Truck,
  Link2,
  SendHorizontal,
  ArrowRight,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Qué es FoodyNow | Plataforma para vender comida online",
  description:
    "Conocé FoodyNow: crea tu tienda online, automatiza pedidos por WhatsApp, cobra con Mercado Pago y gestiona todo tu negocio gastronómico sin comisiones.",
  openGraph: {
    title: "Qué es FoodyNow",
    description:
      "Crea tu tienda online en minutos, conecta WhatsApp y Mercado Pago, y gestiona tu negocio gastronómico sin comisiones.",
    url: "https://foodynow.com.ar/ayuda",
    siteName: "FoodyNow",
    locale: "es_AR",
    type: "article",
  },
}

const anchorLinks = [
  { id: "que-es", label: "Qué es FoodyNow" },
  { id: "comercio", label: "Funciones para el comercio" },
  { id: "cliente", label: "Funciones para el cliente" },
  { id: "configuracion", label: "Configurar la tienda" },
]

const comercioBlocks = [
  {
    icon: ShoppingBag,
    title: "Gestión de tienda",
    bullets: [
      "Personalización completa del perfil del negocio",
      "Logo, imagen de cabecera y slogan",
      "Subdominio propio (ej: tunegocio.foodynow.com.ar)",
      "Información del comercio: dirección, horarios, contacto",
      "Descripción del negocio y fotos del local",
    ],
  },
  {
    icon: CreditCard,
    title: "Configuración de pagos",
    bullets: [
      "Integración con Mercado Pago",
      "Opción de pago en efectivo",
      "Descuentos para pagos en efectivo",
    ],
  },
  {
    icon: Layers,
    title: "Gestión de productos",
    bullets: [
      "Creación de categorías (hamburguesas, viandas, postres, etc.)",
      "Carga de productos por categoría",
      "Múltiples imágenes por producto",
      "Variaciones: tamaños, sabores y combinaciones (combos)",
    ],
  },
  {
    icon: Package,
    title: "Gestión de pedidos",
    bullets: [
      "Recepción de órdenes desde la tienda online",
      "Panel centralizado de pedidos",
      "Visualización clara de cada compra",
    ],
  },
  {
    icon: Printer,
    title: "Operación diaria (cocina y logística)",
    bullets: [
      "Impresión de comandas para cocina",
      "Cambio de estado de pedidos: Preparando, Listo para retirar, Enviado, Entregado, Cancelado",
    ],
  },
  {
    icon: MessageCircle,
    title: "Comunicación con clientes",
    bullets: [
      "Mensajes automáticos de WhatsApp según el estado del pedido",
      "Incluye datos clave: productos, forma de entrega y estado del pedido",
    ],
  },
  {
    icon: BarChart3,
    title: "Control de ventas",
    bullets: ["Registro de pedidos", "Historial de ventas", "Base para análisis del negocio"],
  },
]

const pasosConfig = [
  {
    step: "1️⃣",
    title: "Configurar la tienda",
    bullets: [
      "Cargar logo e imagen principal",
      "Definir nombre, slogan y subdominio",
      "Completar información del negocio: dirección, horarios y contacto",
      "Agregar descripción y fotos del local",
    ],
  },
  {
    step: "2️⃣",
    title: "Configurar medios de pago",
    bullets: ["Conectar Mercado Pago", "Activar pagos en efectivo", "Definir descuentos por pago en efectivo"],
  },
  {
    step: "3️⃣",
    title: "Crear el menú",
    bullets: [
      "Crear categorías (ej: “Viandas”, “Sin TACC”, “Bebidas”)",
      "Cargar productos en cada categoría",
      "Agregar fotos, precios y variaciones (tamaños, sabores, combos)",
    ],
  },
  {
    step: "4️⃣",
    title: "Publicar y compartir",
    bullets: [
      "Obtener el link de tu tienda (subdominio)",
      "Compartirlo en WhatsApp (mensaje automático o difusión) e Instagram (bio o historias)",
    ],
  },
  {
    step: "5️⃣",
    title: "Recibir pedidos",
    bullets: [
      "El cliente navega y realiza la compra",
      "El pedido llega al panel de órdenes",
      "Podés ver detalles, imprimir comanda y cambiar estado",
    ],
  },
  {
    step: "6️⃣",
    title: "Gestionar la entrega",
    bullets: ["Elegir modalidad: retiro en local o delivery (gestionado por el comercio)"],
  },
  {
    step: "7️⃣",
    title: "Comunicar el estado",
    bullets: [
      "Al actualizar el estado, el sistema genera un mensaje listo para enviar por WhatsApp",
      "El cliente está informado en todo momento",
    ],
  },
]

export default function AyudaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-50 via-white to-fuchsia-50">
      <header className="border-b bg-background/70 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-lime-100 text-lime-700">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-[0.2em]">FoodyNow</p>
              <p className="text-lg font-semibold text-foreground">Todo para vender comida online</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {anchorLinks.map((item) => (
              <Link key={item.id} href={`#${item.id}`} className="text-sm text-muted-foreground hover:text-foreground">
                {item.label}
              </Link>
            ))}
            <Link href="/auth/sign-up">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Empezar gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section id="que-es" className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <Badge className="bg-fuchsia-600 text-white px-3 py-1 rounded-full inline-flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4" />
                Conocé la plataforma
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">¿Qué es FoodyNow?</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                FoodyNow es la plataforma para que comercios gastronómicos creen su tienda online con menú, precios y
                pedidos en minutos. Pensada para quienes venden por Instagram o WhatsApp y quieren ordenar su
                comunicación, automatizar pedidos y controlar ventas, sin comisiones.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Cada comercio obtiene su propio sitio con enlace personalizado (ej: <strong>donmario.foodynow.com.ar</strong>),
                listo para compartir con clientes.
              </p>
              <div className="flex flex-wrap gap-3">
                {anchorLinks.map((item) => (
                  <Link key={item.id} href={`#${item.id}`}>
                    <Button variant="outline" className="bg-white/80 hover:bg-white">
                      <Link2 className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
            <Card className="bg-white/90 border-l-4 border-lime-400 shadow-lg">
              <CardHeader>
                <Badge className="w-fit bg-lime-600 text-white mb-3">FoodyNow para negocios</Badge>
                <CardTitle className="text-2xl">Todo el proceso de venta en un solo lugar</CardTitle>
                <CardDescription>Pedidos, pagos, comunicación y control sin fricción ni comisiones.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-fuchsia-600 mt-1" />
                  <span>Automatizá mensajes de WhatsApp según el estado del pedido.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-fuchsia-600 mt-1" />
                  <span>Recibí pagos con Mercado Pago o en efectivo, con descuentos configurables.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 text-fuchsia-600 mt-1" />
                  <span>Gestioná pedidos con panel centralizado, estados y comandas para cocina.</span>
                </div>
                <div className="flex items-start gap-2">
                  <BarChart3 className="w-4 h-4 text-fuchsia-600 mt-1" />
                  <span>Historial y registros listos para analizar tu negocio.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-6 container mx-auto" />

        <section id="comercio" className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start gap-3 mb-8">
            <Badge className="bg-lime-600 text-white text-sm px-3 py-1 rounded-full">Comercios</Badge>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Funciones</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Todo lo que necesita tu comercio</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {comercioBlocks.map(({ icon: Icon, title, bullets }) => (
              <Card key={title} className="h-full border border-lime-100 shadow-sm bg-white/90">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-lime-50 text-lime-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {bullets.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-fuchsia-600 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-6 container mx-auto" />

        <section id="cliente" className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start gap-3 mb-8">
            <Badge className="bg-fuchsia-600 text-white text-sm px-3 py-1 rounded-full">Clientes</Badge>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Experiencia</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Funciones para el cliente</h2>
            </div>
          </div>
          <Card className="bg-white/90 border border-fuchsia-100 shadow">
            <CardContent className="grid md:grid-cols-2 gap-6 p-6 text-muted-foreground">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-fuchsia-600 mt-0.5" />
                  <span>Accede al menú desde un link y navega por categorías y productos.</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShoppingBag className="w-5 h-5 text-fuchsia-600 mt-0.5" />
                  <span>Visualiza precios, opciones y detalles; arma su pedido en minutos.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="w-5 h-5 text-fuchsia-600 mt-0.5" />
                  <span>Elige cómo pagar: Mercado Pago o efectivo.</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Truck className="w-5 h-5 text-fuchsia-600 mt-0.5" />
                  <span>Define la entrega: retiro en local o delivery.</span>
                </div>
                <div className="flex items-start gap-2">
                  <SendHorizontal className="w-5 h-5 text-fuchsia-600 mt-0.5" />
                  <span>Confirma la compra en pocos pasos.</span>
                </div>
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-5 h-5 text-fuchsia-600 mt-0.5" />
                  <span>Recibe actualizaciones del estado del pedido por WhatsApp.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-6 container mx-auto" />

        <section id="configuracion" className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start gap-3 mb-8">
            <Badge className="bg-lime-600 text-white text-sm px-3 py-1 rounded-full">Guía rápida</Badge>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Configurar la tienda</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Cómo configurarla paso a paso</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pasosConfig.map(({ step, title, bullets }) => (
              <Card key={title} className="bg-white/90 border border-lime-100 shadow-sm">
                <CardHeader className="flex flex-row items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center text-base font-semibold">
                    {step}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>Listo en minutos</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {bullets.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-lime-600 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-14">
          <Card className="border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-lime-50 shadow-xl">
            <CardContent className="grid md:grid-cols-3 gap-6 items-center p-8">
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-2xl font-bold text-foreground">Cerramos el círculo</h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  FoodyNow simplifica cómo los comercios gastronómicos venden online: menos mensajes repetidos, pedidos
                  ordenados y mejor experiencia para el cliente, sin comisiones ni complicaciones. Probá gratis 14 días.
                </p>
              </div>
              <div className="flex md:justify-end">
                <div className="space-y-3 w-full md:w-auto">
                  <Link href="/auth/sign-up" className="block">
                    <Button className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                      Crear mi tienda
                      <Rocket className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/auth/login" className="block">
                    <Button variant="outline" className="w-full md:w-auto">
                      Ya tengo cuenta
                      <Settings className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
