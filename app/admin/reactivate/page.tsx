import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ReactivateSubscriptionPage() {
  return (
    <div className="max-w-xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Reactivar Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-lg text-green-800 font-semibold mb-2">
              Podés volver a activar tu cuenta volviendo a suscribirte.
            </p>
          </div>
          <Button className="w-full" variant="success">
            Reactivá tu cuenta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
