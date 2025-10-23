import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"

interface EditProductPageProps {
  params: {
    id: string
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: store } = await supabase.from("stores").select("*").eq("owner_id", user.id).single()

  if (!store) {
    redirect("/admin/setup")
  }

  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      product_options (
        id,
        name,
        type,
        is_required,
        product_option_values (
          id,
          name,
          price_modifier
        )
      )
    `)
    .eq("id", params.id)
    .eq("store_id", store.id)
    .single()

  if (!product) {
    redirect("/admin/products")
  }

  const { data: categories } = await supabase.from("categories").select("*").eq("store_id", store.id).order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Producto</h1>
        <p className="text-muted-foreground">Modifica la información del producto</p>
      </div>

      <ProductForm product={product} categories={categories || []} storeId={store.id} />
    </div>
  )
}
