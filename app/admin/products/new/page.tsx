import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"

export default async function NewProductPage() {
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

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agregar Producto</h1>
        <p className="text-muted-foreground">Crea un nuevo producto para tu catálogo</p>
      </div>

      <ProductForm storeId={store.id} categories={categories || []} />
    </div>
  )
}
