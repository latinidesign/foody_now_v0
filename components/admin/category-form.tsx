"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface CategoryFormProps {
  category?: {
    id: string
    name: string
    description?: string
  }
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = category ? `/api/categories/${category.id}` : "/api/categories"
      const method = category ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Error al guardar la categoría")
      }

      toast.success(category ? "Categoría actualizada" : "Categoría creada")
      router.push("/admin/categories")
      router.refresh()
    } catch (error) {
      console.error("Category save error:", error)
      toast.error("Error al guardar la categoría")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Categorías
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{category ? "Editar Categoría" : "Nueva Categoría"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Bebidas, Comidas, Postres..."
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional de la categoría"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Categoría"}
              </Button>
              <Link href="/admin/categories">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
