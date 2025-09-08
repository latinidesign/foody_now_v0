import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Users, Calendar, XCircle, Eye } from "lucide-react"
import { AnalyticsDateSelector } from "@/components/admin/analytics-date-selector"
import { TopProductsChart } from "@/components/admin/top-products-chart"

interface SearchParams {
  startDate?: string
  endDate?: string
  period?: string
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's store
  const { data: store } = await supabase.from("stores").select("*").eq("owner_id", user.id).single()

  if (!store) {
    redirect("/admin/setup")
  }

  const now = new Date()
  let startDate: Date
  let endDate: Date = now

  if (searchParams.startDate && searchParams.endDate) {
    startDate = new Date(searchParams.startDate)
    endDate = new Date(searchParams.endDate)
  } else {
    // Default to current month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  // Get orders for selected period
  const { data: periodOrders } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .eq("store_id", store.id)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      quantity,
      orders!inner(store_id, created_at, status),
      products!inner(name, id)
    `)
    .eq("orders.store_id", store.id)
    .gte("orders.created_at", startDate.toISOString())
    .lte("orders.created_at", endDate.toISOString())

  const { data: uniqueCustomers } = await supabase
    .from("orders")
    .select("customer_email")
    .eq("store_id", store.id)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())

  const { data: allOrders } = await supabase.from("orders").select("total, status, created_at").eq("store_id", store.id)
  const { data: products } = await supabase.from("products").select("*").eq("store_id", store.id)

  // Calculate statistics
  const totalRevenue = allOrders?.reduce((sum, order) => sum + order.total, 0) || 0
  const periodRevenue = periodOrders?.reduce((sum, order) => sum + order.total, 0) || 0

  const totalOrders = allOrders?.length || 0
  const periodOrdersCount = periodOrders?.length || 0

  const completedOrders = allOrders?.filter((order) => order.status === "delivered").length || 0
  const pendingOrders = allOrders?.filter((order) => order.status === "pending").length || 0

  const cancelledOrders = allOrders?.filter((order) => order.status === "cancelled").length || 0

  const uniqueCustomersCount = new Set(uniqueCustomers?.map((order) => order.customer_email)).size || 0

  const productSales = new Map()
  orderItems?.forEach((item) => {
    const productName = item.products.name
    const currentQuantity = productSales.get(productName) || 0
    productSales.set(productName, currentQuantity + item.quantity)
  })

  const topProducts = Array.from(productSales.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }))

  const statsCards = [
    {
      title: "Ventas Totales",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Desde el inicio",
      period: "all-time",
    },
    {
      title: "Ventas del Período",
      value: `$${periodRevenue.toFixed(2)}`,
      icon: Calendar,
      description: "Período seleccionado",
      period: "period",
    },
    {
      title: "Total de Pedidos",
      value: totalOrders.toString(),
      icon: ShoppingBag,
      description: "Todos los pedidos",
      period: "all-time",
    },
    {
      title: "Pedidos del Período",
      value: periodOrdersCount.toString(),
      icon: ShoppingBag,
      description: "Período seleccionado",
      period: "period",
    },
    {
      title: "Pedidos Completados",
      value: completedOrders.toString(),
      icon: TrendingUp,
      description: `${totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}% del total`,
      period: "completion",
    },
    {
      title: "Pedidos Pendientes",
      value: pendingOrders.toString(),
      icon: Users,
      description: "Requieren atención",
      period: "pending",
    },
    {
      title: "Productos Cancelados",
      value: cancelledOrders.toString(),
      icon: XCircle,
      description: "Pedidos cancelados",
      period: "cancelled",
    },
    {
      title: "Clientes Únicos",
      value: uniqueCustomersCount.toString(),
      icon: Eye,
      description: "Accedieron a la tienda",
      period: "customers",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics - Nivel Básico</h1>
        <p className="text-muted-foreground">Información operativa rápida para tu negocio</p>
      </div>

      <AnalyticsDateSelector />

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <p className="text-sm text-muted-foreground">Top 5 del período seleccionado</p>
          </CardHeader>
          <CardContent>
            <TopProductsChart products={topProducts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Ventas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Promedio por pedido</span>
              <span className="font-medium">${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tasa de conversión</span>
              <span className="font-medium">
                {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pedidos del período</span>
              <span className="font-medium">{periodOrdersCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado del Catálogo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Productos activos</span>
            <span className="font-medium">{products?.length || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Promedio por producto</span>
            <span className="font-medium">
              ${products?.length ? (totalRevenue / products.length).toFixed(2) : "0.00"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pedidos pendientes</span>
            <span className="font-medium text-orange-600">{pendingOrders}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
