import { createAdminClient } from "@/lib/supabase/admin"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { combineStorePath } from "@/lib/store/path"
import { getStoreBasePathFromHeaders } from "@/lib/store/server-path"

interface PaymentSuccessPageProps {
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

export default async function PaymentSuccessPage({ params, searchParams }: PaymentSuccessPageProps) {
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

  if (session.status === "rejected" || session.status === "cancelled") {
    redirect(`/store/${slug}/failure?session_id=${session.id}`)
  }

  const storeBasePath = getStoreBasePathFromHeaders(slug)
  const storeHomeHref = combineStorePath(storeBasePath)

  const orderId = session.order_id
  let order: any = null
  let orderError: any = null

  if (orderId) {
    const result = await supabase
      .from("orders")
      .select(
        `*,
        stores (name, slug)
      `,
      )
      .eq("id", orderId)
      .single()

    order = result.data
    orderError = result.error
  }

  if (orderError) {
    console.error("No se pudo recuperar la orden creada para la sesión", orderError)
  }

  if (orderId && !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Procesando tu pago</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Estamos confirmando tu pedido. Recargar esta página en unos instantes debería mostrar el estado final.
            </p>
            <Link href={storeHomeHref}>
              <Button variant="outline" className="w-full bg-transparent">
                Volver a la Tienda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Estamos procesando tu pago</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Tu pago fue recibido por MercadoPago y estamos esperando la confirmación final. Mantén esta página abierta
              o vuelve más tarde con el identificador de sesión para revisar el estado.
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Importe del pedido</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(session.total)}</p>
            </div>
            <Link href={storeHomeHref}>
              <Button variant="outline" className="w-full bg-transparent">
                Volver a la Tienda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const orderDetailsHref = combineStorePath(storeBasePath, `/order/${order.id}`)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-green-600 dark:text-green-400">¡Pago Exitoso!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="text-muted-foreground mb-2">Tu pedido ha sido confirmado</p>
            <p className="font-semibold">Pedido #{order.id.slice(-8)}</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(order.total)}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">El comercio ha sido notificado</p>
            <p className="font-medium">{order.stores?.name ?? session.stores.name}</p>
            <p className="text-sm">Te contactarán pronto para coordinar la entrega</p>
          </div>

          <div className="space-y-2">
            <Link href={orderDetailsHref}>
              <Button className="w-full">
                Ver Detalles del Pedido
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href={storeHomeHref}>
              <Button variant="outline" className="w-full bg-transparent">
                Volver a la Tienda
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
