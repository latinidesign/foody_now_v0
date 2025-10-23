import { Suspense } from "react"
import { CategoriesTable } from "@/components/admin/categories-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorías</h1>
          <p className="text-muted-foreground">Gestiona las categorías de tus productos</p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando categorías...</div>}>
        <CategoriesTable />
      </Suspense>
    </div>
  )
}
