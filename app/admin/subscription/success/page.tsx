import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, CreditCard, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-fuchsia-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-800">
              ¡Suscripción Exitosa! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-fuchsia-600">
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Plan Premium Activo</span>
              </div>
              <p className="text-muted-foreground">
                Tu suscripción ha sido procesada exitosamente. Ya podés acceder a todas las funciones premium de FoodyNow.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-green-800">¿Qué sigue?</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Configurá tu tienda online</li>
                <li>✅ Agregá productos y categorías</li>
                <li>✅ Conectá WhatsApp para recibir pedidos</li>
                <li>✅ Comenzá a vender</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link href="/admin" className="w-full">
                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
                  Ir al Panel de Administración
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/admin/profile" className="w-full">
                <Button size="lg" variant="outline" className="w-full">
                  Ver Estado de Suscripción
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Si tenés algún problema, podés contactarnos desde el panel de administración.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
