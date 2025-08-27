"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import type { Category } from "@/lib/types/database"

export function CategoriesTable() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta categoría?")) return

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCategories(categories.filter((cat) => cat.id !== id))
      }
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  if (loading) {
    return <div>Cargando categorías...</div>
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">
              <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No hay categorías</h3>
              <p>Crea tu primera categoría para organizar tus productos</p>
            </div>
            <Link href="/admin/categories/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorías ({categories.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-medium">{category.name}</h3>
                {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
                <Badge variant={category.is_active ? "default" : "secondary"}>
                  {category.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/categories/${category.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteCategory(category.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
