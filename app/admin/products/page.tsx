import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductsTable } from "@/components/admin/products-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function ProductsPage() {
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

  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      categories (name)
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Gestiona el catálogo de tu tienda</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Producto
          </Button>
        </Link>
      </div>

      <ProductsTable products={products || []} />
    </div>
  )
}
