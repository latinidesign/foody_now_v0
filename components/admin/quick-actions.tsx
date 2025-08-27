import type { Store } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Package, Tags, Settings, ExternalLink } from "lucide-react"
import Link from "next/link"

interface QuickActionsProps {
  store: Store
}

export function QuickActions({ store }: QuickActionsProps) {
  const actions = [
    {
      title: "Agregar Producto",
      description: "Añadir nuevo producto al catálogo",
      href: "/admin/products/new",
      icon: Plus,
    },
    {
      title: "Gestionar Productos",
      description: "Ver y editar productos existentes",
      href: "/admin/products",
      icon: Package,
    },
    {
      title: "Categorías",
      description: "Organizar productos por categorías",
      href: "/admin/categories",
      icon: Tags,
    },
    {
      title: "Configuración",
      description: "Ajustar configuración de la tienda",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>Gestiona tu tienda fácilmente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Button variant="outline" className="w-full justify-start h-auto p-4 bg-transparent">
              <action.icon className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">{action.title}</p>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          </Link>
        ))}

        <div className="pt-2 border-t">
          <Link href={`/store/${store.slug}`} target="_blank">
            <Button className="w-full justify-start">
              <ExternalLink className="mr-3 h-4 w-4" />
              Ver Mi Tienda Online
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
