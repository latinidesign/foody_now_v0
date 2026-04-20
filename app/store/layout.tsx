import type React from "react"
import { CartProvider } from "@/components/store/cart-context"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>{children}</CartProvider>
  )
}
