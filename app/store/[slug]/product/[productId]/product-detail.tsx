"use client"

import type { Store, Product } from "@/lib/types/database"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/components/store/cart-context"
import { CartButton } from "@/components/store/cart-button"
import { ProductGallery } from "./components/product-gallery"
import { ProductOptions } from "./components/product-options"
import { RelatedProducts } from "./components/related-products"
import { usePathname } from "next/navigation"
import { combineStorePath, deriveStoreBasePathFromPathname } from "@/lib/store/path"

interface ProductDetailProps {
  store: Store
  product: Product & {
    product_options?: any[]
    categories?: { name: string }
  }
  relatedProducts: Product[]
}

const getOptionValues = (option: any) => option.values ?? option.product_option_values ?? []

export function ProductDetail({ store, product, relatedProducts }: ProductDetailProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCart()
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({})
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const pathname = usePathname()
  const storeBasePath = deriveStoreBasePathFromPathname(pathname, store.slug)
  const storeHomeHref = combineStorePath(storeBasePath)

  // Create a stable id for the cart item that includes selected options so
  // variants with different options are stored as separate items in the cart.
  const variantId = `${product.id}:${encodeURIComponent(JSON.stringify(selectedOptions || {}))}`
  const cartQuantity = getItemQuantity(variantId)
  const basePrice = product.sale_price || product.price

  const calculateAdditionalPrice = () => {
    if (!product.product_options) return 0

    return product.product_options.reduce((total, option) => {
      const selectedValue = selectedOptions[option.id]
      const optionValues = getOptionValues(option)

      if (option.type === "quantity" && selectedValue) {
        return (
          total +
          Object.entries(selectedValue).reduce((optionTotal, [valueId, qty]) => {
            const value = optionValues.find((v: any) => v.id === valueId)
            return optionTotal + (value?.price_modifier || 0) * (qty as number)
          }, 0)
        )
      }

      if (option.type === "multiple" && Array.isArray(selectedValue)) {
        return (
          total +
          selectedValue.reduce((optionTotal, valueId) => {
            const value = optionValues.find((v: any) => v.id === valueId)
            return optionTotal + (value?.price_modifier || 0)
          }, 0)
        )
      }

      if (option.type === "single" && selectedValue) {
        const value = optionValues.find((v: any) => v.id === selectedValue)
        return total + (value?.price_modifier || 0)
      }

      return total
    }, 0)
  }

  const additionalPrice = calculateAdditionalPrice()
  const finalPrice = basePrice + additionalPrice

  const handleAddToCart = async () => {
    setIsAdding(true)
    // Use the variant id when adding the item so different option selections
    // create separate entries in the cart.
    await addItem({
      id: variantId,
      // keep original product id for reference
      product_id: product.id,
      name: product.name,
      price: finalPrice,
      image_url: product.image_url,
      quantity: quantity,
      selectedOptions,
    })
    setIsAdding(false)
  }

  const handleUpdateCartQuantity = (newQuantity: number) => {
    // When updating quantity from the product detail page we must update the
    // variant entry in the cart (if present) using variantId.
    if (newQuantity === 0) {
      updateQuantity(variantId, 0)
    } else {
      updateQuantity(variantId, newQuantity)
    }
  }

  const galleryImages = []

  // Add main image if exists
  if (product.image_url) {
    galleryImages.push(product.image_url)
  }

  // Add gallery images if exists (assuming gallery_images is an array field)
  if (product.gallery_images && Array.isArray(product.gallery_images)) {
    galleryImages.push(...product.gallery_images.filter((img) => img !== product.image_url))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex-row justify-between">
          <div className="flex items-center gap-4 justify-between">
            <Link href={storeHomeHref}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">{store.name}</h1>
              <p className="text-sm text-muted-foreground">
                {product.categories?.name && `${product.categories.name} • `}
                {product.name}
              </p>
            </div>
            {/* Right: Carrito de compras */}
            <div className="flex items-center">
              <CartButton />
            </div>   
         
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Gallery */}
          <div>
            <ProductGallery images={galleryImages} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                  {product.categories?.name && (
                    <Badge variant="secondary" className="mb-2">
                      {product.categories.name}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  {product.sale_price && product.sale_price < product.price ? (
                    <div>
                      <Badge variant="destructive" className="mb-2">
                        Oferta
                      </Badge>
                      <div>
                        <span className="text-2xl font-bold text-primary">${product.sale_price}</span>
                        <span className="text-lg text-muted-foreground line-through ml-2">${product.price}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-primary">${product.price}</span>
                  )}
                  {additionalPrice > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">+ ${additionalPrice} por opciones</div>
                  )}
                </div>
              </div>

              {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}
            </div>

            {/* Product Options */}
            {product.product_options && product.product_options.length > 0 && (
              <ProductOptions
                options={product.product_options}
                selectedOptions={selectedOptions}
                onOptionsChange={setSelectedOptions}
              />
            )}

            {/* Quantity and Add to Cart */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cantidad:</span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-medium min-w-[2rem] text-center">{quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Precio base:</span>
                      <span>${basePrice.toFixed(2)}</span>
                    </div>
                    {additionalPrice > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Adicionales:</span>
                        <span>+${additionalPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-lg font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>${(finalPrice * quantity).toFixed(2)}</span>
                    </div>
                  </div>

                  <Button onClick={handleAddToCart} disabled={isAdding} className="w-full" size="lg">
                    {isAdding ? (
                      "Agregando..."
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Agregar al Carrito
                      </>
                    )}
                  </Button>

                  {cartQuantity > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <span>En tu carrito:</span>
                        <span>{cartQuantity} unidades</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleUpdateCartQuantity(cartQuantity - 1)}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-medium min-w-[2rem] text-center">{cartQuantity}</span>
                        <Button variant="outline" size="sm" onClick={() => handleUpdateCartQuantity(cartQuantity + 1)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <RelatedProducts
              products={relatedProducts}
              storeSlug={store.slug}
              basePath={storeBasePath}
            />
          </div>
        )}
      </div>
    </div>
  )
}
