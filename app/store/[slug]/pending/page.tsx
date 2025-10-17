import { createAdminClient } from "@/lib/supabase/admin"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { combineStorePath } from "@/lib/store/path"
import { getStoreBasePathFromHeaders } from "@/lib/store/server-path"

interface PaymentPendingPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ session_id?: string }>
}

const formatCurrency = (value: unknown) => {
  const numericValue = Number(value ?? 0)
  return numericValue.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  })
}

export default async function PaymentPendingPage({ params, searchParams }: PaymentPendingPageProps) {
  const { slug } = await params
  const { session_id } = await searchParams

  if (!session_id) {
    notFound()
  }

  const supabase = createAdminClient()

  const { data: session, error: sessionError } = await supabase
    .from("checkout_sessions")
    .select(
      `*,
      stores (name, slug)
    `,
    )
    .eq("id", session_id)
    .single()

  if (sessionError || !session || !session.stores) {
    notFound()
  }

  if (session.status === "approved" && session.order_id) {
    redirect(`/store/${slug}/success?session_id=${session.id}`)
  }

  if (session.status === "rejected" || session.status === "cancelled") {
    redirect(`/store/${slug}/failure?session_id=${session.id}`)
  }

  const storeBasePath = getStoreBasePathFromHeaders(slug)
  const storeHomeHref = combineStorePath(storeBasePath)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Pago en Proceso</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              MercadoPago está finalizando la validación de tu pago. Este proceso puede demorar algunos minutos.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Identificador de sesión</p>
                  <p className="text-sm text-muted-foreground">{session.id}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Importe</p>
                <p className="text-lg font-semibold text-primary">{formatCurrency(session.total)}</p>
              </div>
            </div>
          </div>
          <Link href={storeHomeHref}>
            <Button variant="outline" className="w-full bg-transparent">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Volver a la Tienda
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}