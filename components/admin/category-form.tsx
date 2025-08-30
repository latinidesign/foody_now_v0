"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Upload, X } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"

interface CategoryFormProps {
  category?: {
    id: string
    name: string
    description?: string
    image_url?: string
  }
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    image_url: category?.image_url || "",
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor selecciona un archivo de imagen válido")
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen debe ser menor a 5MB")
        return
      }

      setUploadedFile(file)

      // Convertir a base64 para vista previa y almacenamiento
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        setFormData({ ...formData, image_url: base64String })
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setFormData({ ...formData, image_url: "" })
    setUploadedFile(null)
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
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-3">
              <Label htmlFor="image_url">Imagen Destacada</Label>

              {formData.image_url ? (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border">
                    <Image
                      src={formData.image_url || "/placeholder.svg"}
                      alt="Vista previa"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={clearImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {uploadedFile && <p className="text-sm text-muted-foreground">Archivo: {uploadedFile.name}</p>}
                  <Input
                    id="image_url"
                    value={uploadedFile ? "" : formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="URL de la imagen"
                    disabled={!!uploadedFile}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Agrega una imagen para hacer más atractiva tu categoría
                    </p>
                    <div className="flex flex-col gap-3">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("file-upload")?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Subir desde dispositivo
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">o</div>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="Pega la URL de la imagen aquí"
                      />
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Recomendado: imagen en formato 16:9 (ej: 800x450px) para mejor visualización. Máximo 5MB.
              </p>
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
