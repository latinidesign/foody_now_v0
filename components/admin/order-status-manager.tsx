'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  Truck, 
  Package,
  XCircle,
  MessageSquare,
  Loader2
} from 'lucide-react'

interface OrderStatusManagerProps {
  orderId: string
  storeId: string
  currentStatus: string
  customerName: string
  customerPhone?: string
  deliveryType: 'pickup' | 'delivery'
  deliveryAddress?: string
  onStatusUpdate?: (newStatus: string) => void
}

const ORDER_STATUSES = [
  { 
    value: 'preparing', 
    label: 'Preparando', 
    icon: ChefHat, 
    color: 'text-blue-600',
    description: 'El pedido está siendo preparado'
  },
  { 
    value: 'ready', 
    label: 'Listo', 
    icon: CheckCircle, 
    color: 'text-green-600',
    description: 'El pedido está listo para retirar o enviar'
  },
  { 
    value: 'out_for_delivery', 
    label: 'En Camino', 
    icon: Truck, 
    color: 'text-purple-600',
    description: 'El pedido está en camino (solo delivery)'
  },
  { 
    value: 'delivered', 
    label: 'Entregado', 
    icon: Package, 
    color: 'text-green-700',
    description: 'El pedido fue entregado'
  },
  { 
    value: 'cancelled', 
    label: 'Cancelado', 
    icon: XCircle, 
    color: 'text-red-600',
    description: 'El pedido fue cancelado'
  },
]

export function OrderStatusManager({ 
  orderId, 
  storeId, 
  currentStatus, 
  customerName,
  customerPhone,
  deliveryType,
  deliveryAddress,
  onStatusUpdate 
}: OrderStatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [estimatedTime, setEstimatedTime] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [lastNotification, setLastNotification] = useState<string | null>(null)

  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) return

    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/whatsapp-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          storeId,
          newStatus: selectedStatus,
          estimatedTime: estimatedTime || undefined,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        onStatusUpdate?.(selectedStatus)
        setLastNotification(result.jobId ? 'WhatsApp enviado' : 'Estado actualizado')
        setSelectedStatus('')
        setEstimatedTime('')
        
        // Clear notification after 3 seconds
        setTimeout(() => setLastNotification(null), 3000)
      } else {
        setLastNotification('Error al actualizar')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setLastNotification('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStatusInfo = () => {
    return ORDER_STATUSES.find(status => status.value === currentStatus)
  }

  const getAvailableStatuses = () => {
    // Filter out delivery statuses for pickup orders
    return ORDER_STATUSES.filter(status => {
      if (deliveryType === 'pickup' && status.value === 'out_for_delivery') {
        return false
      }
      return status.value !== currentStatus
    })
  }

  const currentStatusInfo = getCurrentStatusInfo()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Estado del Pedido</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          {currentStatusInfo && (
            <>
              <currentStatusInfo.icon className={`h-5 w-5 ${currentStatusInfo.color}`} />
              <div>
                <div className="font-medium">{currentStatusInfo.label}</div>
                <div className="text-sm text-muted-foreground">{currentStatusInfo.description}</div>
              </div>
            </>
          )}
        </div>

        {/* Customer Info */}
        <div className="text-sm space-y-1">
          <div><strong>Cliente:</strong> {customerName}</div>
          {customerPhone && (
            <div><strong>Teléfono:</strong> {customerPhone}</div>
          )}
          <div><strong>Tipo:</strong> {deliveryType === 'pickup' ? 'Retiro en local' : 'Delivery'}</div>
          {deliveryAddress && (
            <div><strong>Dirección:</strong> {deliveryAddress}</div>
          )}
        </div>

        {/* Status Update Form */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="new-status">Cambiar estado</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nuevo estado" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableStatuses().map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center space-x-2">
                      <status.icon className={`h-4 w-4 ${status.color}`} />
                      <span>{status.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Time Input */}
          {selectedStatus && ['preparing', 'ready', 'out_for_delivery'].includes(selectedStatus) && (
            <div>
              <Label htmlFor="estimated-time">Tiempo estimado (opcional)</Label>
              <Input
                id="estimated-time"
                placeholder={
                  selectedStatus === 'preparing' ? '30-45 min' :
                  selectedStatus === 'ready' ? 'Disponible para retiro' :
                  selectedStatus === 'out_for_delivery' ? '15-20 min' :
                  ''
                }
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
              />
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleStatusUpdate}
            disabled={!selectedStatus || selectedStatus === currentStatus || loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {customerPhone ? 'Actualizar y Notificar por WhatsApp' : 'Actualizar Estado'}
          </Button>

          {/* Feedback */}
          {lastNotification && (
            <div className="text-sm text-center p-2 bg-green-100 text-green-700 rounded">
              ✅ {lastNotification}
            </div>
          )}

          {/* No Phone Warning */}
          {!customerPhone && (
            <div className="text-sm text-center p-2 bg-yellow-100 text-yellow-700 rounded">
              ⚠️ Sin teléfono - No se enviará notificación WhatsApp
            </div>
          )}
        </div>

        {/* Quick Status Buttons */}
        <div className="pt-2 border-t">
          <Label className="text-xs text-muted-foreground">Acciones rápidas:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {getAvailableStatuses().slice(0, 3).map((status) => (
              <Button
                key={status.value}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStatus(status.value)
                  if (status.value === 'preparing') setEstimatedTime('30-45 min')
                  if (status.value === 'ready' && deliveryType === 'pickup') setEstimatedTime('Disponible para retiro')
                  if (status.value === 'out_for_delivery') setEstimatedTime('15-20 min')
                }}
                className="flex items-center space-x-1"
              >
                <status.icon className={`h-3 w-3 ${status.color}`} />
                <span>{status.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
