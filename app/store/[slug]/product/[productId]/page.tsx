import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductDetail } from "./product-detail"

interface ProductPageProps {
  params: Promise<{ slug: string; productId: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productId } = await params
  const supabase = await createClient()

  if (!supabase) {
    notFound()
  }

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

  // Get product with options
  const { data: product, error: productError } = await supabase
    .from("products")
    .select(`
      *,
      product_options (
        *,
        product_option_values (*)
      ),
      categories (name)
    `)
    .eq("id", productId)
    .eq("store_id", store.id)
    .eq("is_available", true)
    .single()

  if (productError || !product) {
    notFound()
  }

  // Get related products from same category
  const { data: relatedProducts } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("category_id", product.category_id)
    .eq("is_available", true)
    .neq("id", productId)
    .limit(4)

  return <ProductDetail store={store} product={product} relatedProducts={relatedProducts || []} />
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug, productId } = await params
  const supabase = await createClient()

  if (!supabase) {
    return {
      title: "Producto no encontrado",
    }
  }

  const { data: product } = await supabase.from("products").select("name, description").eq("id", productId).single()

  const { data: store } = await supabase.from("stores").select("name").eq("slug", slug).single()

  return {
    title: product ? `${product.name} - ${store?.name}` : "Producto no encontrado",
    description: product?.description || "Producto de la tienda",
  }
}
