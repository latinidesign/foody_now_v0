import { CategoryForm } from "@/components/admin/category-form"

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nueva Categoría</h1>
        <p className="text-muted-foreground">Crea una nueva categoría para organizar tus productos</p>
      </div>

      <CategoryForm />
    </div>
  )
}
