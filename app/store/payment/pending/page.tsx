import { createAdminClient } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { combineStorePath } from "@/lib/store/path"
import { getStoreBasePathFromHeaders } from "@/lib/store/server-path"

interface PaymentPendingPageProps {
  searchParams: Promise<{ order_id?: string }>
}

const formatCurrency = (value: unknown) => {
  const numericValue = Number(value ?? 0)
  return numericValue.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  })
}

export default async function PaymentPendingPage({ searchParams }: PaymentPendingPageProps) {
  const { order_id } = await searchParams

  if (!order_id) {
    notFound()
  }

  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `*,
      stores (name, slug)
    `,
    )
    .eq("id", order_id)
    .single()

  if (error || !order || !order.stores?.slug) {
    notFound()
  }

  if (order.payment_status === "completed") {
    redirect(`/store/payment/success?order_id=${order.id}`)
  }

  if (order.payment_status === "failed" || order.payment_status === "refunded") {
    redirect(`/store/payment/failure?order_id=${order.id}`)
  }

  const storeBasePath = getStoreBasePathFromHeaders(order.stores.slug)
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
                  <p className="text-sm font-medium">Identificador del pedido</p>
                  <p className="text-sm text-muted-foreground">{order.id}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Importe</p>
                <p className="text-lg font-semibold text-primary">{formatCurrency(order.total)}</p>
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
