"use client"

import type { Store, Product } from "@/lib/types/database"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useCart } from "@/components/store/cart-context"
import { CartButton } from "@/components/store/cart-button"
import { ProductGallery } from "./components/product-gallery"
import { ProductOptions } from "./components/product-options"
import { RelatedProducts } from "./components/related-products"
import { usePathname } from "next/navigation"
import { combineStorePath, deriveStoreBasePathFromPathname } from "@/lib/store/path"
import { getSelectedOptionsQuantityTotal } from "@/lib/utils/order-validation"
import { computeItemPricing, type PricingBreakdownItem } from "@/lib/utils/pricing"

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

  const selectedOptionsQuantity = getSelectedOptionsQuantityTotal(selectedOptions)
  const isPricingProduct = Boolean(product.pricing_config)
  const packSize = product.pricing_config?.mode === "unit_only" ? Number(product.pricing_config.quantity) : undefined
  // True si el producto tiene al menos una opcion de tipo "quantity" (sin importar
  // si el usuario ya selecciono algo). Determina si el contador inferior debe
  // ocultarse (Caso B) y si las variedades tienen cap (no, en Caso B son libres).
  const productHasQuantityTypeOption = product.product_options?.some(
    (opt: any) => opt.type === "quantity",
  ) ?? false
  const maxOptionQuantity = isPricingProduct
    ? product.pricing_config?.mode === "unit_only"
      ? packSize * quantity
      : undefined
    : productHasQuantityTypeOption
      ? undefined
      : quantity
  const pricingQuantity = isPricingProduct
    ? product.pricing_config?.mode === "unit_only"
      ? Math.max(selectedOptionsQuantity, (packSize ?? 0) * quantity)
      : selectedOptionsQuantity
    : quantity

  const requiredOptionsQuantity = isPricingProduct && product.pricing_config?.mode === "unit_only"
    ? (packSize ?? 0) * quantity
    : undefined
  const remainingOptionsToSelect = requiredOptionsQuantity !== undefined
    ? Math.max(0, requiredOptionsQuantity - selectedOptionsQuantity)
    : undefined
  const isPackSelectionIncomplete = remainingOptionsToSelect !== undefined && remainingOptionsToSelect > 0

  // Calculo centralizado. `computeItemPricing` decide que fuente usar segun
  // el modo del producto y las opciones seleccionadas, y aplica el fix de
  // redondeo al alza a centavos (2 decimales) sobre el unit price.
  const itemPricing = pricingQuantity > 0
    ? computeItemPricing({ product, pricingQuantity, selectedOptions })
    : null
  const pricingTotal = itemPricing?.total ?? 0
  const unitPrice = itemPricing?.unitPrice ?? 0
  const rawTotal = itemPricing?.rawTotal ?? 0
  const pricingBreakdown = itemPricing?.breakdown ?? []
  const optionsBreakdown = itemPricing?.optionsBreakdown ?? { items: [], total: 0 }
  const pricingSource = itemPricing?.source ?? "base_only"
  const effectiveQuantity = itemPricing?.pricingQuantity ?? pricingQuantity

  const hasQuantityOptionSelected = optionsBreakdown.items.some((i) => i.type === "variety_quantity")
  const canAddToCart = !isPricingProduct
    ? true
    : (!isPackSelectionIncomplete && selectedOptionsQuantity > 0)

  // Log de debugging: ver el breakdown completo en la consola del navegador.
  // Util para detectar inconsistencias entre lo que ve el cliente y lo que cobra MP.
  if (typeof window !== "undefined") {
    console.log("[foodynow/pricing] item breakdown", {
      productId: product.id,
      pricingSource,
      pricingQuantity,
      effectiveQuantity,
      rawTotal,
      unitPrice,
      total: pricingTotal,
      selectedOptions,
      breakdown: pricingBreakdown,
      optionsBreakdown,
    })
  }

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
    try {
      // Use the variant id when adding the item so different option selections
      // create separate entries in the cart.
      await addItem({
        id: variantId,
        product_id: product.id,
        name: product.name,
        price: unitPrice,
        total_price: pricingTotal,
        image_url: product.image_url,
        quantity: effectiveQuantity,
        selectedOptions,
        pricing_snapshot: {
          config: product.pricing_config ?? null,
          source: pricingSource,
          breakdown: pricingBreakdown,
          options_breakdown: optionsBreakdown,
          raw_total: rawTotal,
        },
      })

      toast.success("¡Agregado al pedido!", {
        description: product.name,
        icon: "🛒",
        className: "bg-emerald-600 text-white font-bold shadow-2xl text-center",
        style: {
          border: "4px solid var(--primary)",
          padding: "1rem 1.5rem",
          fontSize: "1.2rem",
          width: "100%",
          maxWidth: "calc(100% - 2rem)",
          minWidth: "16rem",
          boxSizing: "border-box",
          margin: "0 auto",
          display: "block",
        },
      })
    } catch (error) {
      toast.error("No se pudo agregar el producto al pedido")
    } finally {
      setIsAdding(false)
    }
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
            {/* Right: Pedidos de compras */}
            <div className="flex items-center">
              <CartButton />
            </div>   
         
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Gallery */}
          <div className="w-full max-w-full overflow-hidden">
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
                  {product.pricing_config ? (
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        Precio configurado
                      </Badge>
                      <div>
                        <span className="text-2xl font-bold text-primary">${pricingTotal.toFixed(2)}</span>
                        <div className="text-sm text-muted-foreground mt-1">
                          {product.pricing_config.mode === "unit_only"
                            ? `Pack de ${product.pricing_config.quantity} unidad(es)`
                            : `Precio unitario aprox. $${unitPrice.toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  ) : productHasQuantityTypeOption ? (
                    <div>
                      <span className="text-2xl font-bold text-primary">${pricingTotal.toFixed(2)}</span>
                      <div className="text-sm text-muted-foreground mt-1">
                        {effectiveQuantity > 0
                          ? `${effectiveQuantity} unidad(es) segun variedades elegidas`
                          : "Elegi las variedades para ver el total"}
                      </div>
                    </div>
                  ) : pricingSource === "single_multiple_options" ? (
                    <div>
                      <span className="text-2xl font-bold text-primary">${pricingTotal.toFixed(2)}</span>
                      <div className="text-sm text-muted-foreground mt-1">
                        {(() => {
                          const singleItems = optionsBreakdown.items.filter((i) => i.type === "variety_single")
                          if (singleItems.length > 0) {
                            return singleItems.length === 1
                              ? singleItems[0].name
                              : `${singleItems.length} opciones seleccionadas`
                          }
                          return "Precio base + adicionales"
                        })()}
                      </div>
                    </div>
                  ) : product.sale_price && product.sale_price < product.price ? (
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
                maxQuantity={maxOptionQuantity}
                pricingConfig={product.pricing_config ?? undefined}
              />
            )}

            {/* Quantity and Add to Cart */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {isPricingProduct ? (
                    <div className="space-y-4">
                      {packSize && (
                        <div className="text-sm text-muted-foreground">
                          Total de unidades del pack: <span className="font-semibold">{quantity * packSize}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Unidades seleccionadas:</span>
                        <span className="font-semibold">{selectedOptionsQuantity}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Selecciona hasta {packSize ? quantity * packSize : "la cantidad deseada"} variedades.
                        {product.pricing_config?.mode === "unit_only" && (
                          <span> Se cobrará un pack completo de {product.pricing_config.quantity} unidad(es).</span>
                        )}
                      </p>
                      {selectedOptionsQuantity === 0 && (
                        <p className="text-sm text-destructive">Selecciona sabores o variedades para calcular el precio.</p>
                      )}
                      {isPackSelectionIncomplete && (
                        <p className="text-sm font-semibold text-destructive">
                          Aún faltan {remainingOptionsToSelect} variedad(es) por seleccionar para completar el pack.
                        </p>
                      )}
                    </div>
                  ) : productHasQuantityTypeOption ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Unidades seleccionadas:</span>
                        <span className="font-semibold">{effectiveQuantity}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Elige cuantas unidades de cada variedad queres. El total se calcula multiplicando la cantidad de cada variedad por su precio.
                      </p>
                      {effectiveQuantity === 0 && (
                        <p className="text-sm text-destructive">Selecciona al menos una variedad con cantidad mayor a 0.</p>
                      )}
                    </div>
                  ) : (
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
                  )}

                  <div className="space-y-2">
                    {pricingSource === "pricing_config" ? (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Detalle de precio:</div>
                        {pricingBreakdown.map((item: PricingBreakdownItem, index) => (
                          <div key={`${item.type}-${index}`} className="flex items-center justify-between text-sm">
                            <span>
                              {item.type === "dozen" && `${item.quantity} docena(s)`}
                              {item.type === "half_dozen" && `${item.quantity} media docena(s)`}
                              {item.type === "unit" && item.unit_size ? `${item.quantity} pack(s) de ${item.unit_size} unidad(es)` : `${item.quantity} unidad(es)`}
                            </span>
                            <span>${item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : pricingSource === "quantity_options" ? (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Detalle por variedad:</div>
                        {optionsBreakdown.items
                          .filter((i) => i.type === "variety_quantity")
                          .map((item) => {
                            const v = item as Extract<typeof item, { type: "variety_quantity" }>
                            return (
                              <div key={`${item.optionId}-${item.valueId}`} className="flex items-center justify-between text-sm">
                                <span>
                                  {v.quantity} × {v.name} <span className="text-muted-foreground">@ ${v.unitPrice}</span>
                                </span>
                                <span>${v.subtotal.toFixed(2)}</span>
                              </div>
                            )
                          })}
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const singleItems = optionsBreakdown.items.filter(
                            (i) => i.type === "variety_single",
                          )
                          const multipleItems = optionsBreakdown.items.filter(
                            (i) => i.type === "variety_multiple",
                          )
                          const hasSingle = singleItems.length > 0
                          if (singleItems.length === 0 && multipleItems.length === 0) {
                            return (
                              <div className="flex items-center justify-between text-sm">
                                <span>Precio base:</span>
                                <span>${basePrice.toFixed(2)}</span>
                              </div>
                            )
                          }
                          return (
                            <div className="space-y-1">
                              {hasSingle ? (
                                singleItems.map((item) => {
                                  const v = item as Extract<typeof item, { type: "variety_single" }>
                                  return (
                                    <div key={`${item.optionId}-${item.valueId}`} className="flex items-center justify-between text-sm">
                                      <span>
                                        {quantity} × {v.name}
                                        <span className="text-muted-foreground"> @ ${v.unitPrice.toFixed(2)}</span>
                                      </span>
                                      <span>${(v.unitPrice * quantity).toFixed(2)}</span>
                                    </div>
                                  )
                                })
                              ) : (
                                <div className="flex items-center justify-between text-sm">
                                  <span>
                                    {quantity} × producto base
                                    <span className="text-muted-foreground"> @ ${basePrice.toFixed(2)}</span>
                                  </span>
                                  <span>${(basePrice * quantity).toFixed(2)}</span>
                                </div>
                              )}
                              {multipleItems.map((item) => {
                                const v = item as Extract<typeof item, { type: "variety_multiple" }>
                                return (
                                  <div key={`${item.optionId}-${item.valueId}`} className="flex items-center justify-between text-sm">
                                    <span>
                                      {quantity} × {v.name}
                                      <span className="text-muted-foreground"> @ ${v.unitPrice.toFixed(2)}</span>
                                    </span>
                                    <span>${(v.unitPrice * quantity).toFixed(2)}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </>
                    )}

                    <div className="flex items-center justify-between text-lg font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>${pricingTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button onClick={handleAddToCart} disabled={isAdding || !canAddToCart} className="w-full" size="lg">
                    {isAdding ? (
                      "Agregando..."
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Agregar al Pedido
                      </>
                    )}
                  </Button>
                  {isPackSelectionIncomplete && (
                    <p className="text-sm font-semibold text-destructive mt-2">
                      Aún faltan {remainingOptionsToSelect} variedad(es) por seleccionar antes de agregar al pedido.
                    </p>
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
