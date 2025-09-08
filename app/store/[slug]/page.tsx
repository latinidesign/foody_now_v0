import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { StoreHeader } from "@/components/store/store-header"
import { ProductCatalog } from "@/components/store/product-catalog"
import { WhatsAppContact } from "@/components/store/whatsapp-contact"
import { InstallPrompt } from "@/components/pwa/install-prompt"

interface StorePageProps {
  params: Promise<{ slug: string }>
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params

  console.log("[v0] StorePage - slug received:", slug)

  const supabase = await createClient()

  if (!supabase) {
    console.log("[v0] StorePage - Supabase client not available, showing demo")
    // Show demo data when Supabase is not available
    const demoStore = {
      id: "demo-store",
      name: `Tienda ${slug}`,
      slug: slug,
      description: "Esta tienda no existe o está inactiva. Modo demostración activado.",
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
            description: "Este es un producto de demostración. La tienda solicitada no existe o está inactiva.",
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
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Tienda No Encontrada</h3>
            <p className="text-orange-700 text-sm">
              La tienda "{slug}" no existe o está inactiva. Contacta al administrador para más información.
            </p>
          </div>
          <ProductCatalog store={demoStore} categories={demoCategories} />
        </main>
        <InstallPrompt />
      </div>
    )
  }

  console.log("[v0] StorePage - Querying store with slug:", slug)

  // Get store data
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  console.log("[v0] StorePage - Store query result:", { store, storeError })

  if (storeError) {
    console.log("[v0] StorePage - Store error details:", storeError)

    if (storeError.code === "PGRST116" || storeError.message?.includes("No rows found")) {
      console.log("[v0] StorePage - Store not found, showing demo mode")

      const demoStore = {
        id: "demo-store",
        name: `Tienda ${slug}`,
        slug: slug,
        description: "Esta tienda no existe o está inactiva. Modo demostración activado.",
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
              description: "Este es un producto de demostración. La tienda solicitada no existe o está inactiva.",
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
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-semibold text-orange-800 mb-2">Tienda No Encontrada</h3>
              <p className="text-orange-700 text-sm">
                La tienda "{slug}" no existe o está inactiva. Contacta al administrador para más información.
              </p>
            </div>
            <ProductCatalog store={demoStore} categories={demoCategories} />
          </main>
          <InstallPrompt />
        </div>
      )
    }

    // For other database errors, still show 404
    notFound()
  }

  if (!store) {
    console.log("[v0] StorePage - No store data returned")
    notFound()
  }

  console.log("[v0] StorePage - Store found:", store.name)

  // Get categories with products
  const { data: categories, error: categoriesError } = await supabase
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

  if (categoriesError) {
    console.log("[v0] StorePage - Categories error:", categoriesError)
  }

  console.log("[v0] StorePage - Categories loaded:", categories?.length || 0)

  return (
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

  const { data: store } = await supabase.from("stores").select("name, description").eq("slug", slug).single()

  return {
    title: store?.name || "Tienda",
    description: store?.description || "Tienda online",
  }
}
