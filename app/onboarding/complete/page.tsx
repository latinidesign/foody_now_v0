import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QzTrayInstructions } from "@/components/admin/qztray-instructions"

export default function OnboardingCompletePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 to-lime-100">
      <div className="max-w-2xl mx-auto p-6 pt-16 space-y-8">
        <div className="text-center space-y-3">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold">¡Tu tienda está lista!</h1>
          <p className="text-muted-foreground">Ya podés empezar a recibir pedidos.</p>
        </div>

        <hr className="border-t border-border" />

        <QzTrayInstructions />

        <div className="text-center pt-4">
          <Button asChild>
            <Link href="/admin">Ir al panel de pedidos</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
