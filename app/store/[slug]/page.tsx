import { createClient } from "@/lib/supabase/server"
import { StoreHeader } from "@/components/store/store-header"
import { ProductCatalog } from "@/components/store/product-catalog"
import { WhatsAppContact } from "@/components/store/whatsapp-contact"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { CheckoutSuccessModal } from "@/components/store/checkout-success-modal"
import { StoreFooter } from "@/components/store/store-footer"
import { StoreMetaTags } from "@/components/store/store-meta-tags"

interface StorePageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic" // evita SSG 404 por slugs no pre-generados
export const revalidate = 0 // Sin cache para evitar problemas de subdominios

export default async function StorePage({ params }: StorePageProps) {
  // console.log(`[DEBUG] Cargando tienda con params:`, await params)
  const { slug } = await params
  const supabase = await createClient().catch((error) => {
    console.warn(`[store][slug:${slug}] Supabase client unavailable, falling back to demo data`, error)
    return null
  })

  if (!supabase) {
    // Show demo data when Supabase is not available
    const demoStore = {
      id: "demo-store",
      owner_id: "demo-owner",
      name: "Tienda Demo",
      slug: slug,
      description: "Tienda de demostración - Configura Supabase para datos reales",
      logo_url: undefined,
      banner_url: undefined,
      primary_color: "#2D5016",
      whatsapp_phone: undefined,
      is_active: true,
      delivery_radius: 10,
      delivery_fee: 500,
      min_order_amount: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const demoCategories = [
      {
        id: "demo-cat-1",
        store_id: "demo-store",
        name: "Productos Demo",
        description: "Categoría de demostración",
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        products: [
          {
            id: "demo-prod-1",
            store_id: "demo-store",
            category_id: "demo-cat-1",
            name: "Producto Demo",
            description: "Este es un producto de demostración. Configura Supabase para ver datos reales.",
            price: 1000,
            image_url: "/producto-demo.png",
            is_available: true,
            sort_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
    .maybeSingle() // Usa maybeSingle() en lugar de single() para evitar error 406

  
  // Ahora hay que comprobar que el periodo de 15 di
  if (storeError || !store) {
    console.log(`[DEBUG] Store not found for slug: ${slug}`, storeError)

    // TODO: Restaurar notFound() cuando los datos estén garantizados
    // notFound()

    const placeholderStore = {
      id: "placeholder",
      owner_id: "placeholder-owner",
      name: `Tienda ${slug}`,
      slug: slug,
      description: "Esta tienda está siendo configurada. Vuelve pronto.",
      logo_url: undefined,
      banner_url: undefined,
      primary_color: "#2D5016",
      whatsapp_phone: undefined,
      is_active: true,
      delivery_radius: 10,
      delivery_fee: 500,
      min_order_amount: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  // 🔒 VERIFICAR SUSCRIPCIÓN DEL PROPIETARIO
  const { data: subscription } = await supabase
  .from("subscriptions")
  .select("paid_ends_at")
  .eq("store_id", store.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle()

  const now = new Date()

  // Verificar periodo de prueba
  const trialEndsAt = store.trial_ends_at ? new Date(store.trial_ends_at) : null
  const trialActive = trialEndsAt ? trialEndsAt > now : false

  // Verificar suscripción
  let hasValidSubscription = false

  if (subscription?.paid_ends_at) {
    const paidEndsAt = new Date(subscription.paid_ends_at)
    hasValidSubscription = paidEndsAt > now
  } else {
    console.warn(`[store][slug:${slug}] No subscription found for store ${store.id}`)
  }

  const canAccessStore = trialActive || hasValidSubscription

  // Log para depuración de acceso
  /*
  console.log("[STORE ACCESS CHECK]", {
    store: store.slug,
    trialActive,
    trialEndsAt,
    hasValidSubscription
  }) */

  // Si no cumple ninguna condición → tienda suspendida
  if (!canAccessStore) {
    const { StoreSuspendedMessage } = await import("@/components/store/store-suspended-message")
    return <StoreSuspendedMessage storeName={store.name} whatsappPhone={store.whatsapp_phone} />
  }

  const { data: storeSettings, error } = await supabase
    .from("store_settings")
    .select("business_hours, is_open")
    .eq("store_id", store.id)
    .maybeSingle() // Usa maybeSingle() en lugar de single() para evitar error 406

  // console.log(`[DEBUG] storeSettings for store ${store.slug}:`, storeSettings)
  // console.log(`[DEBUG] storeSettings error for store ${store.slug}:`, error)

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
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader store={storeWithSettings} />
      <main className="container mx-auto px-4 py-6 flex-1">
        <ProductCatalog store={storeWithSettings} categories={categories || []} />
      </main>
      <StoreFooter />
      <InstallPrompt />
      {store.whatsapp_phone && (
        <WhatsAppContact storeSlug={store.slug} storePhone={store.whatsapp_phone} storeName={store.name} />
      )}
      <CheckoutSuccessModal />
    </div>
  )
}

export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params
  const supabase = await createClient().catch((error) => {
    console.warn(`[store][metadata][slug:${slug}] Supabase client unavailable`, error)
    return null
  })

  if (!supabase) {
    return {
      title: "Tienda Demo",
      description: "Tienda de demostración - Configura Supabase para datos reales",
      openGraph: {
        title: "Tienda Demo",
        description: "Tienda de demostración - Configura Supabase para datos reales",
        type: "website",
      },
    }
  }

  const { data: store } = await supabase
    .from("stores")
    .select("name, description, logo_url, header_image_url, slug")
    .eq("slug", slug)
    .maybeSingle()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://foodynow.com.ar"
  const storeUrl = `${baseUrl}/store/${slug}`
  const ogImage = store?.logo_url || store?.header_image_url || `${baseUrl}/foodynow_logo-wt.svg`

  return {
    title: store?.name || `Tienda ${slug}`,
    description: store?.description || "Tienda online",
    openGraph: {
      title: store?.name || `Tienda ${slug}`,
      description: store?.description || "Tienda online en FoodyNow",
      type: "website",
      url: storeUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: store?.name,
        },
      ],
      siteName: "FoodyNow",
      locale: "es_AR",
    },
    twitter: {
      card: "summary_large_image",
      title: store?.name || `Tienda ${slug}`,
      description: store?.description || "Tienda online en FoodyNow",
      images: [ogImage],
    },
  }
}
