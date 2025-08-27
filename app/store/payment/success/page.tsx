import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface PaymentSuccessPageProps {
  searchParams: Promise<{ order_id?: string }>
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
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
            <p className="text-2xl font-bold text-primary">${order.total}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">El comercio ha sido notificado</p>
            <p className="font-medium">{order.stores.name}</p>
            <p className="text-sm">Te contactarán pronto para coordinar la entrega</p>
          </div>

          <div className="space-y-2">
            <Link href={`/store/${order.stores.slug}/order/${order.id}`}>
              <Button className="w-full">
                Ver Detalles del Pedido
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/store/${order.stores.slug}`}>
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
