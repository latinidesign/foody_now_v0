import type React from "react"
import { CartProvider } from "@/components/store/cart-context"
import { PWAProvider } from "@/components/pwa/pwa-provider"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PWAProvider>
      <CartProvider>{children}</CartProvider>
    </PWAProvider>
  )
}
