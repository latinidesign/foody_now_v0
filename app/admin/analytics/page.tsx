import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Users, Calendar, Package } from "lucide-react"

export default async function AnalyticsPage() {
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

  const { data: allOrders } = await supabase.from("orders").select("total, status, created_at").eq("store_id", store.id)

  const { data: monthlyOrders } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .eq("store_id", store.id)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const { data: weeklyOrders } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .eq("store_id", store.id)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const { data: products } = await supabase.from("products").select("*").eq("store_id", store.id)

  // Calculate statistics
  const totalRevenue = allOrders?.reduce((sum, order) => sum + order.total, 0) || 0
  const monthlyRevenue = monthlyOrders?.reduce((sum, order) => sum + order.total, 0) || 0
  const weeklyRevenue = weeklyOrders?.reduce((sum, order) => sum + order.total, 0) || 0

  const totalOrders = allOrders?.length || 0
  const monthlyOrdersCount = monthlyOrders?.length || 0
  const weeklyOrdersCount = weeklyOrders?.length || 0

  const completedOrders = allOrders?.filter((order) => order.status === "delivered").length || 0
  const pendingOrders = allOrders?.filter((order) => order.status === "pending").length || 0
  const totalProducts = products?.length || 0

  const statsCards = [
    {
      title: "Ingresos Totales",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Desde el inicio",
      period: "all-time",
    },
    {
      title: "Ingresos del Mes",
      value: `$${monthlyRevenue.toFixed(2)}`,
      icon: Calendar,
      description: "Últimos 30 días",
      period: "monthly",
    },
    {
      title: "Ingresos de la Semana",
      value: `$${weeklyRevenue.toFixed(2)}`,
      icon: TrendingUp,
      description: "Últimos 7 días",
      period: "weekly",
    },
    {
      title: "Total de Pedidos",
      value: totalOrders.toString(),
      icon: ShoppingBag,
      description: "Todos los pedidos",
      period: "all-time",
    },
    {
      title: "Pedidos del Mes",
      value: monthlyOrdersCount.toString(),
      icon: ShoppingBag,
      description: "Últimos 30 días",
      period: "monthly",
    },
    {
      title: "Pedidos de la Semana",
      value: weeklyOrdersCount.toString(),
      icon: ShoppingBag,
      description: "Últimos 7 días",
      period: "weekly",
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
      title: "Total de Productos",
      value: totalProducts.toString(),
      icon: Package,
      description: "En catálogo",
      period: "products",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground">Análisis detallado de tu negocio</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Performance Summary */}
      <div className="grid gap-6 md:grid-cols-2">
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
              <span className="text-sm text-muted-foreground">Pedidos por semana</span>
              <span className="font-medium">{weeklyOrdersCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Catálogo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Productos activos</span>
              <span className="font-medium">{totalProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Promedio por producto</span>
              <span className="font-medium">
                ${totalProducts > 0 ? (totalRevenue / totalProducts).toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pedidos pendientes</span>
              <span className="font-medium text-orange-600">{pendingOrders}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
