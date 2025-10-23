import { CategoryForm } from "@/components/admin/category-form"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface EditCategoryPageProps {
  params: {
    id: string
  }
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const supabase = await createClient()

  const { data: category, error } = await supabase.from("categories").select("*").eq("id", params.id).single()

  if (error || !category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Categoría</h1>
        <p className="text-muted-foreground">Modifica los datos de la categoría</p>
      </div>

      <CategoryForm category={category} />
    </div>
  )
}
