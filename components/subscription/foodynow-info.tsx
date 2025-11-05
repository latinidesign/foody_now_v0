"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Store, 
  Smartphone, 
  BarChart3, 
  MessageCircle, 
  Clock, 
  Shield,
  TrendingUp,
  Users
} from "lucide-react"

export function FoodyNowInfo() {
  const benefits = [
    {
      icon: Store,
      title: "Tienda Online Completa",
      description: "Crea tu tienda profesional en minutos"
    },
    {
      icon: Smartphone,
      title: "Optimizada para Móviles",
      description: "Tus clientes pueden ordenar desde cualquier dispositivo"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Integrado",
      description: "Recibe pedidos y mantente conectado con tus clientes"
    },
    {
      icon: BarChart3,
      title: "Estadísticas en Tiempo Real",
      description: "Analiza ventas, productos top y tendencias"
    },
    {
      icon: Clock,
      title: "Gestión de Horarios",
      description: "Controla cuándo recibir pedidos automáticamente"
    },
    {
      icon: Shield,
      title: "Pagos Seguros",
      description: "Integración con MercadoPago para pagos confiables"
    }
  ]

  const stats = [
    { label: "Restaurantes activos", value: "500+" },
    { label: "Pedidos procesados", value: "10,000+" },
    { label: "Tiempo de setup", value: "< 15 min" },
    { label: "Soporte", value: "24/7" }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">FoodyNow</h1>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            La plataforma que necesita tu restaurante
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Transforma tu negocio con una tienda online profesional. 
            Gestiona pedidos, conecta con clientes y aumenta tus ventas.
          </p>
        </div>
        
        {/* Trial highlight */}
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
          <TrendingUp className="h-4 w-4" />
          ¡Prueba GRATIS por 30 días!
        </div>
      </div>

      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-center">Únete a la revolución digital</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Beneficios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Por qué elegir FoodyNow?</CardTitle>
          <CardDescription>
            Todo lo que necesitas para digitalizar tu restaurante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{benefit.title}</h4>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Proceso simple */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Es muy fácil empezar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                1
              </Badge>
              <span className="text-sm">Registrate y crea tu cuenta</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                2
              </Badge>
              <span className="text-sm">Configura tu tienda en minutos</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                3
              </Badge>
              <span className="text-sm">¡Empieza a recibir pedidos!</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Garantía */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-800">Garantía de satisfacción</span>
        </div>
        <p className="text-sm text-blue-700">
          Si no estás satisfecho durante los primeros 30 días, cancela sin costo.
          Sin preguntas, sin complicaciones.
        </p>
      </div>
    </div>
  )
}
