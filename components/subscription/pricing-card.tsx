"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap } from "lucide-react"

interface PricingCardProps {
  onSubscribe: () => void
  isLoading?: boolean
}

export function PricingCard({ onSubscribe, isLoading }: PricingCardProps) {
  const features = [
    "Tienda online completa",
    "Gestión de pedidos ilimitados", 
    "WhatsApp Business integrado",
    "Estadísticas avanzadas",
    "Productos ilimitados",
    "Soporte prioritario",
    "Personalización de marca",
    "Analytics detallados"
  ]

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 shadow-lg">
      {/* Badge de más popular */}
      <div className="absolute -right-12 top-6 rotate-45 bg-primary px-12 py-1 text-xs font-semibold text-primary-foreground">
        MÁS POPULAR
      </div>
      
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Plan Básico</CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Todo lo que necesitas para tu tienda online
        </CardDescription>
        
        {/* Precio */}
        <div className="flex items-baseline justify-center gap-1 pt-4">
          <span className="text-4xl font-bold text-primary">$48.900</span>
          <span className="text-sm text-muted-foreground">/mes</span>
        </div>
        
        {/* Trial badge */}
        <Badge variant="secondary" className="mx-auto mt-2 bg-green-100 text-green-800 hover:bg-green-100">
          <Star className="h-3 w-3 mr-1" />
          30 días GRATIS
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Descripción del trial */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-green-800">
            🎉 ¡Empezá tu prueba gratuita hoy!
          </p>
          <p className="text-xs text-green-600 mt-1">
            30 días completos para probar todas las funciones
          </p>
        </div>
        
        {/* Lista de características */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">¿Qué incluye?</h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Sin compromiso:</strong> Cancela cuando quieras durante el período de prueba.
            Solo se cobrará después de los 30 días gratuitos.
          </p>
        </div>
        
        {/* Botón de suscripción */}
        <Button 
          onClick={onSubscribe}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
          size="lg"
        >
          {isLoading ? (
            "Procesando..."
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Comenzar Prueba Gratuita
            </>
          )}
        </Button>
        
        {/* Texto legal */}
        <p className="text-xs text-center text-muted-foreground">
          Al hacer clic, aceptas nuestros{" "}
          <a href="/terms" className="underline hover:text-foreground">
            términos de servicio
          </a>{" "}
          y{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            política de privacidad
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
