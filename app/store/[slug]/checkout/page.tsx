import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import { CheckoutForm } from "@/components/store/checkout-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { combineStorePath } from "@/lib/store/path"
import { getStoreBasePathFromHeaders } from "@/lib/store/server-path"

interface CheckoutPageProps {
  params: Promise<{ slug: string }>
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const storeBasePath = await getStoreBasePathFromHeaders(slug)
  const storeHomeHref = combineStorePath(storeBasePath)

  const { data: store, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error || !store) {
    notFound()
  }

  const adminClient = createAdminClient()

  const { data: paymentSettings } = await adminClient    .from("store_settings")
    .select("mercadopago_public_key")
    .eq("store_id", store.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
           <Link href={storeHomeHref}>
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
        <CheckoutForm store={store} mercadopagoPublicKey={paymentSettings?.mercadopago_public_key ?? null} />
      </main>
    </div>
  )
}
