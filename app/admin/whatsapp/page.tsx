import { Suspense } from 'react'
import { WhatsAppQueueManager } from '@/components/admin/whatsapp-queue-manager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Settings, Activity } from 'lucide-react'

interface WhatsAppPageProps {
  params: {
    storeId: string
  }
}

export default function WhatsAppPage({ params }: WhatsAppPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">
            Gestiona la cola de mensajes y notificaciones de WhatsApp
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistema de Cola</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Activo</div>
            <p className="text-xs text-muted-foreground">
              Los mensajes se procesan automáticamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuración</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Cloud API</div>
            <p className="text-xs text-muted-foreground">
              Usando WhatsApp Business Cloud API
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Automáticas</div>
            <p className="text-xs text-muted-foreground">
              Se envían al confirmar pedidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Manager */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Cola</CardTitle>
          <CardDescription>
            Monitorea y administra los mensajes de WhatsApp pendientes y fallidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando cola de mensajes...</div>}>
            <WhatsAppQueueManager storeId={params.storeId} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Cómo Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">🔄 Flujo Automático</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Cliente realiza un pago</li>
                <li>• Push notification a la tienda</li>
                <li>• WhatsApp de confirmación al cliente</li>
                <li>• Actualizaciones de estado automáticas</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⚙️ Gestión Manual</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Cambiar estado desde pedidos</li>
                <li>• Reintentar mensajes fallidos</li>
                <li>• Priorizar mensajes urgentes</li>
                <li>• WhatsApp directo como respaldo</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Consejos</h4>
            <ul className="text-sm space-y-1 text-blue-700">
              <li>• Los mensajes se reintentan automáticamente con backoff exponencial</li>
              <li>• Puedes usar el botón de WhatsApp directo si un mensaje falla</li>
              <li>• La cola se limpia automáticamente cada 6 horas</li>
              <li>• Los pedidos sin teléfono solo reciben push notifications</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
