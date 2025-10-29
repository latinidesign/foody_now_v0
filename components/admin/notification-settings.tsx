"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, MessageSquare, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { storeNotificationService } from "@/lib/notifications/store-notifications"
import { whatsappQueue } from "@/lib/queue/whatsapp-queue"

interface NotificationSettingsProps {
  storeId: string
  storeName: string
}

export function NotificationSettings({ storeId, storeName }: NotificationSettingsProps) {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default')
  const [whatsappQueueStats, setWhatsappQueueStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Verificar soporte de notificaciones
    const supported = storeNotificationService.isSupported()
    const permission = storeNotificationService.getPermissionStatus()
    
    setPushSupported(supported)
    setPushPermission(permission)
    setPushEnabled(permission === 'granted')

    // Verificar que la clave VAPID esté disponible (desde servidor)
    const checkVapidKey = async () => {
      try {
        const response = await fetch('/api/vapid/public-key')
        const data = await response.json()
        console.log('[NotificationSettings] VAPID key available:', !!data.publicKey)
        if (!data.publicKey) {
          console.error('[NotificationSettings] VAPID public key not found on server')
        }
      } catch (error) {
        console.error('[NotificationSettings] Failed to check VAPID key:', error)
      }
    }
    
    checkVapidKey()

    // Obtener estadísticas de la cola de WhatsApp
    const stats = whatsappQueue.getStats()
    setWhatsappQueueStats(stats)

    // Actualizar estadísticas cada 5 segundos
    const interval = setInterval(() => {
      const newStats = whatsappQueue.getStats()
      setWhatsappQueueStats(newStats)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handlePushToggle = async () => {
    if (!pushSupported) {
      toast.error("Las notificaciones push no están soportadas en este navegador")
      return
    }

    // Verificar que la clave VAPID esté disponible desde el servidor
    try {
      const response = await fetch('/api/vapid/public-key')
      const data = await response.json()
      
      if (!data.publicKey) {
        toast.error("Las notificaciones push no están configuradas (falta clave VAPID)")
        console.error('[NotificationSettings] VAPID key missing on server')
        return
      }
    } catch (error) {
      toast.error("Error verificando configuración VAPID")
      console.error('[NotificationSettings] VAPID check failed:', error)
      return
    }

    setLoading(true)
    try {
      if (pushEnabled) {
        // Desuscribir
        await storeNotificationService.unsubscribe(storeId)
        setPushEnabled(false)
        toast.success("Notificaciones push desactivadas")
      } else {
        // Inicializar y suscribir
        console.log('[NotificationSettings] Starting initialization...')
        const initialized = await storeNotificationService.initialize()
        if (initialized) {
          console.log('[NotificationSettings] Initialization successful, starting subscription...')
          const subscribed = await storeNotificationService.subscribe(storeId)
          if (subscribed) {
            setPushEnabled(true)
            setPushPermission('granted')
            toast.success("Notificaciones push activadas")
          } else {
            toast.error("No se pudo crear la suscripción push (revisa la consola para detalles)")
          }
        } else {
          toast.error("No se pudieron inicializar las notificaciones (revisa la consola para detalles)")
        }
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error)
      toast.error(`Error al cambiar configuración de notificaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const testPushNotification = () => {
    storeNotificationService.showLocalNotification({
      title: "🔔 Notificación de Prueba",
      body: `Las notificaciones están funcionando correctamente en ${storeName}`,
      icon: "/icon-192.png",
      data: { test: true },
    })
  }

  const cleanupWhatsappQueue = async () => {
    try {
      whatsappQueue.cleanup(24) // Limpiar trabajos de más de 24 horas
      const newStats = whatsappQueue.getStats()
      setWhatsappQueueStats(newStats)
      toast.success("Cola de WhatsApp limpiada")
    } catch (error) {
      console.error("Error cleaning queue:", error)
      toast.error("Error al limpiar la cola")
    }
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications para la Tienda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Notificaciones Push para la Tienda
          </CardTitle>
          <CardDescription>
            Recibe notificaciones instantáneas en tu navegador cuando lleguen nuevos pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Las notificaciones push no están soportadas en este navegador
              </p>
            </div>
          ) : pushPermission === 'denied' ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Las notificaciones están bloqueadas. Habilítalas en la configuración del navegador.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones push activas</Label>
                <p className="text-sm text-muted-foreground">
                  {pushEnabled 
                    ? "Recibirás notificaciones de nuevos pedidos y pagos" 
                    : "Activa para recibir notificaciones instantáneas"
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={pushEnabled} 
                  onCheckedChange={handlePushToggle}
                  disabled={loading}
                />
                {pushEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testPushNotification}
                  >
                    <Bell className="h-4 w-4 mr-1" />
                    Probar
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cola de WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Cola de Mensajes WhatsApp
          </CardTitle>
          <CardDescription>
            Estado actual de los mensajes de WhatsApp para clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{whatsappQueueStats.pending}</div>
              <div className="text-sm text-yellow-600">Pendientes</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{whatsappQueueStats.processing}</div>
              <div className="text-sm text-blue-600">Procesando</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{whatsappQueueStats.completed}</div>
              <div className="text-sm text-green-600">Completados</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{whatsappQueueStats.failed}</div>
              <div className="text-sm text-red-600">Fallidos</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Limpieza automática</p>
              <p className="text-sm text-muted-foreground">
                Se eliminan trabajos completados/fallidos después de 24 horas
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={cleanupWhatsappQueue}
            >
              Limpiar ahora
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información sobre el sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-purple-500" />
            Cómo funciona el sistema de notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">🔔 Notificaciones para la tienda:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Push notifications instantáneas cuando llega un pedido</li>
              <li>• Notificación cuando se confirma un pago</li>
              <li>• No requiere WhatsApp, funciona directo en el navegador</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">📱 Notificaciones para clientes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• WhatsApp automático cuando se confirma el pedido</li>
              <li>• Mensajes de cambio de estado (preparando, listo, etc.)</li>
              <li>• Cola de mensajes con reintentos automáticos</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">⚡ Flujo automático:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Cliente paga → Push a la tienda + WhatsApp al cliente</li>
              <li>• Cambio de estado → WhatsApp al cliente</li>
              <li>• Todo funciona en segundo plano</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
