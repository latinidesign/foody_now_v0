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
import { Loader2, ArrowLeft, Plus, Package, Upload, X, ImageIcon } from "lucide-react"
import Link from "next/link"
import type { Category } from "@/lib/types/database"
import { ProductOptionsForm } from "./product-options-form"

interface ProductOption {
  id?: string
  name: string
  type: "single" | "multiple" | "quantity"
  isRequired: boolean
  values: ProductOptionValue[]
}

interface ProductOptionValue {
  id?: string
  name: string
  priceModifier: number
}

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
  const galleryFileRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    salePrice: product?.sale_price?.toString() || "",
    categoryId: product?.category_id || "0",
    imageUrl: product?.image_url || "",
    galleryImages: product?.gallery_images || [],
    isAvailable: product?.is_available ?? true,
  })

  const [productOptions, setProductOptions] = useState<ProductOption[]>(
    product?.product_options?.map((option: any) => ({
      id: option.id,
      name: option.name,
      type: option.type,
      isRequired: option.is_required,
      values:
        option.product_option_values?.map((value: any) => ({
          id: value.id,
          name: value.name,
          priceModifier: value.price_modifier,
        })) || [],
    })) || [],
  )

  const handleGalleryUpload = async (files: FileList) => {
    const newImages: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file && file.type.startsWith("image/")) {
        // Resize image to 800x450px
        const resizedImage = await resizeImage(file, 800, 450)
        newImages.push(resizedImage)
      }
    }

    setFormData({
      ...formData,
      galleryImages: [...formData.galleryImages, ...newImages],
    })
  }

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const removeGalleryImage = (index: number) => {
    const newGalleryImages = formData.galleryImages.filter((_, i) => i !== index)
    setFormData({ ...formData, galleryImages: newGalleryImages })
  }

  const moveGalleryImage = (fromIndex: number, toIndex: number) => {
    const newGalleryImages = [...formData.galleryImages]
    const [movedImage] = newGalleryImages.splice(fromIndex, 1)
    newGalleryImages.splice(toIndex, 0, movedImage)
    setFormData({ ...formData, galleryImages: newGalleryImages })
  }

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
      categoryId: "0",
      imageUrl: "",
      galleryImages: [],
      isAvailable: true,
    })
    setProductOptions([])
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
        gallery_images: formData.galleryImages.length > 0 ? formData.galleryImages : null,
        is_available: formData.isAvailable,
        product_options: productOptions.map((option) => ({
          name: option.name,
          type: option.type,
          is_required: option.isRequired,
          values: option.values.map((value) => ({
            name: value.name,
            price_modifier: value.priceModifier,
          })),
        })),
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
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Productos
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>{product ? "Editar Producto" : "Nuevo Producto"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <DialogDescription>Crea una nueva categoría para organizar mejor tus productos</DialogDescription>
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
                  <SelectItem value="0">Sin categoría</SelectItem>
                  {localCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAvailable"
                checked={formData.isAvailable}
                onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked as boolean })}
              />
              <Label htmlFor="isAvailable">Producto disponible</Label>
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes del Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Imagen Principal del Producto</Label>
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Galería de Imágenes (800x450px)</Label>
                <Button type="button" variant="outline" onClick={() => galleryFileRef.current?.click()}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Agregar Imágenes
                </Button>
              </div>

              <input
                ref={galleryFileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleGalleryUpload(e.target.files)
                  }
                }}
              />

              {formData.galleryImages.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Arrastra las imágenes para reordenar. La primera imagen será la principal en la galería.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.galleryImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-[16/9] rounded-lg overflow-hidden border bg-muted">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Galería ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Image Controls */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => moveGalleryImage(index, index - 1)}
                            >
                              ←
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeGalleryImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>

                          {index < formData.galleryImages.length - 1 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => moveGalleryImage(index, index + 1)}
                            >
                              →
                            </Button>
                          )}
                        </div>

                        {/* Image Number */}
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Options section */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionales y Opciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductOptionsForm options={productOptions} onChange={setProductOptions} />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <Card>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
