import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { CheckoutForm } from "@/components/store/checkout-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CheckoutPageProps {
  params: Promise<{ slug: string }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error || !store) {
    notFound()
  }

  const handleOrderComplete = (orderId: string) => {
    redirect(`/store/${slug}/order/${orderId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/store/${slug}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a la Tienda
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Finalizar Pedido</h1>
              <p className="text-sm text-muted-foreground">{store.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <CheckoutForm store={store} onOrderComplete={handleOrderComplete} />
      </main>
    </div>
  )
}
