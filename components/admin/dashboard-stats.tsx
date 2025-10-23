import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react"

interface DashboardStatsProps {
  stats: Array<{
    total: number
    status: string
    created_at: string
  }>
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const totalRevenue = stats.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = stats.length
  const completedOrders = stats.filter((order) => order.status === "delivered").length
  const pendingOrders = stats.filter((order) => order.status === "pending").length

  const statsCards = [
    {
      title: "Ingresos del Mes",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Total facturado",
    },
    {
      title: "Pedidos Totales",
      value: totalOrders.toString(),
      icon: ShoppingBag,
      description: "Últimos 30 días",
    },
    {
      title: "Pedidos Completados",
      value: completedOrders.toString(),
      icon: TrendingUp,
      description: `${totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}% del total`,
    },
    {
      title: "Pedidos Pendientes",
      value: pendingOrders.toString(),
      icon: Users,
      description: "Requieren atención",
    },
  ]

  return (
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
  )
}
