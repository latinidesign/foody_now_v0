import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, CreditCard, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { SubscriptionStatus } from "@/components/admin/subscription-status"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">Información de tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Miembro desde</p>
              <p className="text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link href="/admin/settings">
              <Button>Configurar Tienda</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Estado de Suscripción */}
      <div className="mt-6">
        <SubscriptionStatus />
      </div>
    </div>
  )
}
