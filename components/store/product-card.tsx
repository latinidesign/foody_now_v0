"use client"

import type { Product } from "@/lib/types/database"
import { ArrowRight, Minus, Plus } from "lucide-react"
import { useCart } from "./cart-context"
import { useStoreStatus } from "./store-hours-context"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface ProductCardProps {
  product: Product
  viewMode: "grid" | "list"
  storeSlug: string
}

function PriceDisplay({ product, align = "left" }: { product: Product; align?: "left" | "right" }) {
  const alignClass = align === "right" ? "text-right" : ""

  if (product.pricing_config) {
    return (
      <div className={alignClass}>
        <div className="font-heading font-extrabold text-[13.5px] md:text-base text-[#538013] leading-none">
          Precio según cantidad
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">Calculado en la ficha</div>
      </div>
    )
  }

  if (product.sale_price && product.sale_price < product.price) {
    return (
      <div className={`flex items-baseline gap-1.5 flex-wrap ${alignClass}`}>
        <span className="font-heading font-extrabold text-base md:text-xl text-[#538013] leading-none">
          ${product.sale_price.toLocaleString("es-AR")}
        </span>
        <span className="text-[12px] text-muted-foreground line-through">
          ${product.price.toLocaleString("es-AR")}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-baseline ${alignClass}`}>
      <span className="font-heading font-extrabold text-base md:text-xl text-[#538013] leading-none">
        ${product.price.toLocaleString("es-AR")}
      </span>
    </div>
  )
}

function BuyButton({ href, compact = false }: { href: string; compact?: boolean }) {
  return (
    <Link href={href} className="block">
      <button
        className={`
          w-full rounded-full bg-lime-300 text-[#18260a] font-semibold
          inline-flex items-center justify-center gap-1.5
          hover:bg-lime-400 active:scale-[0.97] transition-all duration-150
          ${compact
            ? "h-8 px-4 text-[12.5px] w-auto whitespace-nowrap"
            : "h-[38px] md:h-11 text-[13px] md:text-[14.5px]"
          }
        `}
      >
        Ver <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
      </button>
    </Link>
  )
}

function QuantityControls({
  quantity,
  onDecrement,
  onIncrement,
  compact = false,
}: {
  quantity: number
  onDecrement: () => void
  onIncrement: () => void
  compact?: boolean
}) {
  const btnClass = compact
    ? "w-7 h-7 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
    : "w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "w-full justify-between"}`}>
      <button className={btnClass} onClick={onDecrement}>
        <Minus className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </button>
      <span className="font-semibold min-w-[1.5rem] text-center text-sm">{quantity}</span>
      <button className={btnClass} onClick={onIncrement}>
        <Plus className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </button>
    </div>
  )
}

export function ProductCard({ product, viewMode, storeSlug }: ProductCardProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCart()
  const { isOpen, isConfigured } = useStoreStatus()
  const [_isAdding, setIsAdding] = useState(false)
  const quantity = getItemQuantity(product.id)
  const pathname = usePathname()
  const isStoreSubdomain = pathname ? !pathname.startsWith(`/store/${storeSlug}`) : false
  const productLinkBase = isStoreSubdomain ? "" : `/store/${storeSlug}`
  const productLink = `${productLinkBase}/product/${product.id}`

  const _handleAddToCart = async () => {
    setIsAdding(true)
    await addItem({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image_url: product.image_url,
      quantity: 1,
    })
    setIsAdding(false)
  }

  const hasOffer = !!(product.sale_price && product.sale_price < product.price)
  const canPurchase = isOpen === true

  if (viewMode === "list") {
    return (
      <ProductListCard
        product={product}
        productLink={productLink}
        quantity={quantity}
        updateQuantity={updateQuantity}
        hasOffer={hasOffer}
        canPurchase={canPurchase}
        isConfigured={isConfigured}
      />
    )
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden flex flex-col cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group">
      <Link href={productLink}>
        <div className="relative aspect-square md:aspect-[4/3] overflow-hidden bg-neutral-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground text-xs">Sin imagen</span>
            </div>
          )}
          {hasOffer && (
            <span className="absolute top-2 left-2 bg-[#e23b3b] text-white text-[10.5px] md:text-xs font-bold rounded-full px-2 py-0.5 shadow-sm z-10">
              Oferta
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-2.5 md:p-[15px] gap-1.5 md:gap-[7px]">
        <Link href={productLink}>
          <h3 className="font-heading font-bold text-[14.5px] md:text-lg text-foreground leading-tight line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="text-muted-foreground text-[12px] md:text-[13.5px] leading-snug line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-1 md:pt-1.5">
          <PriceDisplay product={product} />
          <div className="mt-2 md:mt-3">
            {canPurchase ? (
              quantity > 0 ? (
                <QuantityControls
                  quantity={quantity}
                  onDecrement={() => updateQuantity(product.id, quantity - 1)}
                  onIncrement={() => updateQuantity(product.id, quantity + 1)}
                />
              ) : (
                <BuyButton href={productLink} />
              )
            ) : (
              <div className="text-center py-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {isConfigured ? "Cerrado" : "Próximamente"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductListCard({
  product,
  productLink,
  quantity,
  updateQuantity,
  hasOffer,
  canPurchase,
  isConfigured,
}: {
  product: Product
  productLink: string
  quantity: number
  updateQuantity: (id: string, qty: number) => void
  hasOffer: boolean
  canPurchase: boolean
  isConfigured: boolean
}) {
  return (
    <>
      {/* Mobile list card */}
      <div className="md:hidden bg-card rounded-2xl shadow-sm flex gap-2.5 p-2.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
        <Link href={productLink}>
          <div className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-neutral-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground text-[10px]">Sin imagen</span>
              </div>
            )}
            {hasOffer && (
              <span className="absolute top-1.5 left-1.5 bg-[#e23b3b] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none z-10">
                Oferta
              </span>
            )}
          </div>
        </Link>
        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
          <Link href={productLink}>
            <h3 className="font-heading font-bold text-[15px] text-foreground leading-tight line-clamp-1 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p className="text-muted-foreground text-[12.5px] leading-snug line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-auto pt-1.5 gap-2">
            <PriceDisplay product={product} />
            {canPurchase ? (
              quantity > 0 ? (
                <QuantityControls
                  quantity={quantity}
                  onDecrement={() => updateQuantity(product.id, quantity - 1)}
                  onIncrement={() => updateQuantity(product.id, quantity + 1)}
                  compact
                />
              ) : (
                <BuyButton href={productLink} compact />
              )
            ) : (
              <span className="text-xs text-muted-foreground font-medium">
                {isConfigured ? "Cerrado" : "Próximamente"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop list card */}
      <div className="hidden md:flex bg-card rounded-2xl shadow-sm gap-5 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 items-center group">
        <Link href={productLink}>
          <div className="relative flex-shrink-0 w-[190px] h-[140px] rounded-xl overflow-hidden bg-neutral-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground text-xs">Sin imagen</span>
              </div>
            )}
            {hasOffer && (
              <span className="absolute top-2 left-2 bg-[#e23b3b] text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-sm z-10">
                Oferta
              </span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <Link href={productLink}>
            <h3 className="font-heading font-bold text-xl text-foreground leading-tight line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p className="text-muted-foreground text-sm leading-snug line-clamp-2 max-w-[60ch]">
              {product.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end justify-center gap-3 flex-shrink-0 min-w-[170px]">
          <PriceDisplay product={product} align="right" />
          {canPurchase ? (
            quantity > 0 ? (
              <QuantityControls
                quantity={quantity}
                onDecrement={() => updateQuantity(product.id, quantity - 1)}
                onIncrement={() => updateQuantity(product.id, quantity + 1)}
              />
            ) : (
              <div className="w-[170px]">
                <BuyButton href={productLink} />
              </div>
            )
          ) : (
            <span className="text-xs text-muted-foreground font-medium">
              {isConfigured ? "Cerrado" : "Próximamente"}
            </span>
          )}
        </div>
      </div>
    </>
  )
}
