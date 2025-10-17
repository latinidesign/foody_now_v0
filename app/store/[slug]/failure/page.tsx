import { createAdminClient } from "@/lib/supabase/admin"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { combineStorePath } from "@/lib/store/path"
import { getStoreBasePathFromHeaders } from "@/lib/store/server-path"

interface PaymentFailurePageProps {
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

export default async function PaymentFailurePage({ params, searchParams }: PaymentFailurePageProps) {
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

  const storeBasePath = getStoreBasePathFromHeaders(slug)
  const storeHomeHref = combineStorePath(storeBasePath)
  const checkoutHref = combineStorePath(storeBasePath, "/checkout")

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-red-600 dark:text-red-400">Pago No Procesado</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="text-muted-foreground mb-2">Hubo un problema con el pago</p>
            <p className="font-semibold">Sesión #{session.id.slice(-8)}</p>
            <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(session.total)}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">No te preocupes</p>
            <p className="font-medium">Tu carrito sigue disponible</p>
            <p className="text-sm">Puedes intentar pagar nuevamente desde la tienda</p>
          </div>

          <div className="space-y-2">
            <Button className="w-full" asChild>
              <Link href={checkoutHref}>
                <RefreshCw className="mr-2 w-4 h-4" />
                Intentar pagar nuevamente
              </Link>
            </Button>
            <Link href={storeHomeHref}>
              <Button variant="outline" className="w-full bg-transparent">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Volver a la Tienda
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}