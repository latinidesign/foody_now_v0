"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, ArrowLeft, Plus, Package, Upload } from "lucide-react"
import Link from "next/link"
import type { Category } from "@/lib/types/database"

interface ProductFormProps {
  storeId: string
  categories: Category[]
  product?: any // For editing
}

export function ProductForm({ storeId, categories, product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [localCategories, setLocalCategories] = useState(categories)
  const [continueAdding, setContinueAdding] = useState(false)
  const imageFileRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    salePrice: product?.sale_price?.toString() || "",
    categoryId: product?.category_id || "0", // Updated default value to be a non-empty string
    imageUrl: product?.image_url || "",
    isAvailable: product?.is_available ?? true,
  })

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    setCategoryLoading(true)
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_id: storeId,
          name: newCategoryName.trim(),
          is_active: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear la categoría")
      }

      const newCategory = await response.json()
      setLocalCategories([...localCategories, newCategory])
      setFormData({ ...formData, categoryId: newCategory.id })
      setNewCategoryName("")
      setShowCategoryDialog(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCategoryLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      salePrice: "",
      categoryId: "0", // Updated default value to be a non-empty string
      imageUrl: "",
      isAvailable: true,
    })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const productData = {
        store_id: storeId,
        name: formData.name,
        description: formData.description || null,
        price: Number.parseFloat(formData.price),
        sale_price: formData.salePrice ? Number.parseFloat(formData.salePrice) : null,
        category_id:
          formData.categoryId && formData.categoryId !== "" && formData.categoryId !== "0" ? formData.categoryId : null,
        image_url: formData.imageUrl || null,
        is_available: formData.isAvailable,
      }

      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar el producto")
      }

      if (continueAdding && !product) {
        resetForm()
        setContinueAdding(false)
      } else {
        router.push("/admin/products")
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setFormData({ ...formData, imageUrl: base64 })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Productos
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{product ? "Editar Producto" : "Nuevo Producto"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Hamburguesa Clásica"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe tu producto..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Precio de Oferta</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">Categoría</Label>
                  <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Nueva Categoría
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nueva Categoría</DialogTitle>
                        <DialogDescription>
                          Crea una nueva categoría para organizar mejor tus productos
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="categoryName">Nombre de la Categoría</Label>
                          <Input
                            id="categoryName"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Hamburguesas, Bebidas, etc."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={categoryLoading || !newCategoryName.trim()}
                            className="flex-1"
                          >
                            {categoryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Categoría
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowCategoryDialog(false)
                              setNewCategoryName("")
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin categoría</SelectItem> {/* Updated value prop to be a non-empty string */}
                    {localCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Imagen del Producto</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={() => imageFileRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir
                    </Button>
                  </div>
                  <input
                    ref={imageFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                  />
                  {formData.imageUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={formData.imageUrl || "/placeholder.svg"}
                        alt="Vista previa del producto"
                        className="w-20 h-20 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      >
                        Quitar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked as boolean })}
                />
                <Label htmlFor="isAvailable">Producto disponible</Label>
              </div>
            </div>

            <div className="space-y-4">
              {!product && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="continueAdding"
                    checked={continueAdding}
                    onCheckedChange={(checked) => setContinueAdding(checked as boolean)}
                  />
                  <Label htmlFor="continueAdding">Agregar otro producto después de guardar</Label>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {continueAdding && !product ? (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Guardar y Agregar Otro
                    </>
                  ) : (
                    <>{product ? "Actualizar Producto" : "Crear Producto"}</>
                  )}
                </Button>
                <Link href="/admin/products">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
