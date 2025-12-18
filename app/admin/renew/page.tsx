import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function RenewSubscriptionPage() {
  return (
    <div className="max-w-xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            Renovar Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-lg text-yellow-800 font-semibold mb-2">
              Tu pago no fue procesado.
            </p>
            <p className="text-sm text-yellow-700">
              Revisá tu correo electrónico. Mercado Pago te envió un mensaje para volver a pagar la suscripción utilizando otro medio de pago.
            </p>
          </div>
          {/* No mostrar botón de suscripción aquí */}
        </CardContent>
      </Card>
    </div>
  )
}
