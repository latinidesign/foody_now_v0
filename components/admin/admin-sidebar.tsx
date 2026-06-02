"use client"

import type { Store as StoreType } from "@/lib/types/database"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  BarChart3,
  StoreIcon,
  Tags,
  ExternalLink,
  MessageCircle,
  CreditCard,
  Bell,
  LifeBuoy,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { memo } from "react"

interface AdminSidebarProps {
  store: StoreType | null
}

const navigation = [
  { name: "Info General", href: "/admin", icon: LayoutDashboard },
  { name: "Categorías", href: "/admin/categories", icon: Tags },
  { name: "Productos", href: "/admin/products", icon: Package },
  { name: "Pedidos", href: "/admin/orders", icon: ShoppingBag },
  { name: "Estadísticas", href: "/admin/analytics", icon: BarChart3 },
  { name: "Comunicación", href: "/admin/settings/whatsapp", icon: MessageCircle },
  { name: "Suscripción", href: "/admin/subscription", icon: CreditCard },
  { name: "Configuración", href: "/store-settings", icon: Settings },
]

export const AdminSidebar = memo(function AdminSidebar({ store }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r lg:block hidden">
      <div className="flex flex-col h-full">
        {/* Logo/Store Info */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 flex-col">
            <img src={store?.logo_url || "/placeholder.svg"} alt={store?.name || "Mi Tienda"} className="rounded-full size-36" />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-lg truncate">{store?.name || "Mi Tienda"}</h2>
              <p className="text-sm text-muted-foreground">Panel de Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn("w-full justify-start", isActive && "bg-primary text-primary-foreground")}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          {/* CAMBIO: Botón Ayuda que redirige a /admin/help */}
          <Link href="/admin/help">
            <Button
              variant={pathname === "/admin/help" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                pathname === "/admin/help" && "bg-primary text-primary-foreground"
              )}
            >
              <LifeBuoy className="mr-3 h-4 w-4" />
              Ayuda
            </Button>
          </Link>
        </div>

        {/* Store Link */}
        {store && (
          <div className="p-4 border-t">
            <Link href={`/store/${store.slug}`} target="_blank">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <StoreIcon className="mr-3 h-4 w-4" />
                Ver Mi Tienda
                <ExternalLink className="ml-auto h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Version Info */}
        <div className="p-2 border-t text-center text-xs text-muted-foreground">
          FoodyNow v0.1.13
        </div>
      </div>
    </div>
  )
})
