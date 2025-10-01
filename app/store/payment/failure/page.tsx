import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { combineStorePath } from "@/lib/store/path"
import { getStoreBasePathFromHeaders } from "@/lib/store/server-path"

interface PaymentFailurePageProps {
  searchParams: Promise<{ order_id?: string }>
}

export default async function PaymentFailurePage({ searchParams }: PaymentFailurePageProps) {
  const { order_id } = await searchParams

  if (!order_id) {
    notFound()
  }

  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      stores (name, slug)
    `)
    .eq("id", order_id)
    .single()

  if (error || !order) {
    notFound()
  }
  const storeBasePath = getStoreBasePathFromHeaders(order.stores.slug)
  const storeHomeHref = combineStorePath(storeBasePath)


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
            <p className="font-semibold">Pedido #{order.id.slice(-8)}</p>
            <p className="text-2xl font-bold text-muted-foreground">${order.total}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">No te preocupes</p>
            <p className="font-medium">Tu pedido está guardado</p>
            <p className="text-sm">Puedes intentar pagar nuevamente</p>
          </div>

          <div className="space-y-2">
            <Button className="w-full">
              <RefreshCw className="mr-2 w-4 h-4" />
              Intentar Pagar Nuevamente
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
