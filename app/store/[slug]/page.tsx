import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { StoreHeader } from "@/components/store/store-header"
import { ProductCatalog } from "@/components/store/product-catalog"
import { CartProvider } from "@/components/store/cart-context"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { PWAProvider } from "@/components/pwa/pwa-provider"
import { WhatsAppContact } from "@/components/store/whatsapp-contact"

interface StorePageProps {
  params: Promise<{ slug: string }>
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Get store data
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (storeError || !store) {
    notFound()
  }

  // Get categories with products
  const { data: categories } = await supabase
    .from("categories")
    .select(`
      *,
      products (
        *,
        product_options (
          *,
          product_option_values (*)
        )
      )
    `)
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("sort_order")

  return (
    <PWAProvider>
      <CartProvider>
        <div className="min-h-screen bg-background">
          <StoreHeader store={store} />
          <main className="container mx-auto px-4 py-6">
            <ProductCatalog store={store} categories={categories || []} />
          </main>
          <InstallPrompt />
          {store.whatsapp_phone && (
            <WhatsAppContact storeSlug={store.slug} storePhone={store.whatsapp_phone} storeName={store.name} />
          )}
        </div>
      </CartProvider>
    </PWAProvider>
  )
}

export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase.from("stores").select("name, description").eq("slug", slug).single()

  return {
    title: store?.name || "Tienda",
    description: store?.description || "Tienda online",
  }
}
