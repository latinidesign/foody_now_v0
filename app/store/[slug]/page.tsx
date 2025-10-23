import { createClient } from "@/lib/supabase/server"
import { StoreHeader } from "@/components/store/store-header"
import { ProductCatalog } from "@/components/store/product-catalog"
import { WhatsAppContact } from "@/components/store/whatsapp-contact"
import { InstallPrompt } from "@/components/pwa/install-prompt"

interface StorePageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic" // evita SSG 404 por slugs no pre-generados
export const revalidate = 0 // Sin cache para evitar problemas de subdominios

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  if (!supabase) {
    // Show demo data when Supabase is not available
    const demoStore = {
      id: "demo-store",
      name: "Tienda Demo",
      slug: slug,
      description: "Tienda de demostración - Configura Supabase para datos reales",
      logo_url: null,
      banner_url: null,
      primary_color: "#2D5016",
      whatsapp_phone: null,
      is_active: true,
    }

    const demoCategories = [
      {
        id: "demo-cat-1",
        name: "Productos Demo",
        description: "Categoría de demostración",
        products: [
          {
            id: "demo-prod-1",
            name: "Producto Demo",
            description: "Este es un producto de demostración. Configura Supabase para ver datos reales.",
            price: 1000,
            image_url: "/producto-demo.png",
            is_available: true,
            product_options: [],
          },
        ],
      },
    ]

    return (
      <div className="min-h-screen bg-background">
        <StoreHeader store={demoStore} />
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Modo Demostración</h3>
            <p className="text-yellow-700 text-sm">
              Esta tienda está en modo demostración. Para ver datos reales, configura las variables de entorno de
              Supabase.
            </p>
          </div>
          <ProductCatalog store={demoStore} categories={demoCategories} />
        </main>
        <InstallPrompt />
      </div>
    )
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (storeError || !store) {
    console.log(`[DEBUG] Store not found for slug: ${slug}`, storeError)

    // TODO: Restaurar notFound() cuando los datos estén garantizados
    // notFound()

    const placeholderStore = {
      id: "placeholder",
      name: `Tienda ${slug}`,
      slug: slug,
      description: "Esta tienda está siendo configurada. Vuelve pronto.",
      logo_url: null,
      banner_url: null,
      primary_color: "#2D5016",
      whatsapp_phone: null,
      is_active: true,
    }

    return (
      <div className="min-h-screen bg-background">
        <StoreHeader store={placeholderStore} />
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Tienda en Configuración</h3>
            <p className="text-blue-700 text-sm">
              Esta tienda está siendo configurada. Por favor, vuelve pronto para ver nuestros productos.
            </p>
          </div>
        </main>
        <InstallPrompt />
      </div>
    )
  }

  const { data: storeSettings } = await supabase
    .from("store_settings")
    .select("business_hours, is_open")
    .eq("store_id", store.id)
    .maybeSingle() // Usa maybeSingle() en lugar de single() para evitar error 406

  const storeWithSettings = {
    ...store,
    business_hours: storeSettings?.business_hours || null,
    is_open: storeSettings?.is_open ?? true,
  }

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
    <div className="min-h-screen bg-background">
      <StoreHeader store={storeWithSettings} />
      <main className="container mx-auto px-4 py-6">
        <ProductCatalog store={storeWithSettings} categories={categories || []} />
      </main>
      <InstallPrompt />
      {store.whatsapp_phone && (
        <WhatsAppContact storeSlug={store.slug} storePhone={store.whatsapp_phone} storeName={store.name} />
      )}
    </div>
  )
}

export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  if (!supabase) {
    return {
      title: "Tienda Demo",
      description: "Tienda de demostración - Configura Supabase para datos reales",
    }
  }

  const { data: store } = await supabase.from("stores").select("name, description").eq("slug", slug).maybeSingle() // Usa maybeSingle() en lugar de single() para evitar error 406

  return {
    title: store?.name || `Tienda ${slug}`,
    description: store?.description || "Tienda online",
  }
}
