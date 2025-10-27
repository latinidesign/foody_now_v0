'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  X,
  ArrowUp,
  MessageSquare,
  Phone
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface WhatsAppJob {
  id: string
  type: 'customer_confirmation' | 'status_update' | 'delivery_notification'
  to: string
  storeId: string
  orderId: string
  templateData: {
    customerName: string
    storeName: string
    orderStatus?: string
    estimatedTime?: string
    total?: number
  }
  attempts: number
  maxAttempts: number
  scheduledAt: string
  createdAt: string
  processedAt?: string
  failedAt?: string
  error?: string
}

interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
}

interface WhatsAppQueueManagerProps {
  storeId: string
}

export function WhatsAppQueueManager({ storeId }: WhatsAppQueueManagerProps) {
  const [stats, setStats] = useState<QueueStats>({ pending: 0, processing: 0, completed: 0, failed: 0 })
  const [pendingJobs, setPendingJobs] = useState<WhatsAppJob[]>([])
  const [failedJobs, setFailedJobs] = useState<WhatsAppJob[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadQueueData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/whatsapp-queue?storeId=${storeId}`)
      const data = await response.json()
      
      if (data.stats) {
        setStats(data.stats)
      }
      
      if (data.recentJobs) {
        setPendingJobs(data.recentJobs.pending || [])
        setFailedJobs(data.recentJobs.failed || [])
      }
    } catch (error) {
      console.error('Failed to load queue data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQueueData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadQueueData, 30000)
    return () => clearInterval(interval)
  }, [storeId])

  const handleJobAction = async (action: string, jobId: string) => {
    try {
      setActionLoading(jobId)
      
      const response = await fetch('/api/admin/whatsapp-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          storeId,
          jobId,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        await loadQueueData() // Reload data
      } else {
        console.error(`Failed to ${action} job:`, result.error)
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'customer_confirmation':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'status_update':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case 'delivery_notification':
        return <MessageSquare className="h-4 w-4 text-purple-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getJobTypeName = (type: string) => {
    switch (type) {
      case 'customer_confirmation':
        return 'Confirmación'
      case 'status_update':
        return 'Estado'
      case 'delivery_notification':
        return 'Entrega'
      default:
        return type
    }
  }

  const getStatusBadge = (job: WhatsAppJob) => {
    if (job.processedAt) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Enviado</Badge>
    }
    if (job.failedAt) {
      return <Badge variant="destructive">Falló</Badge>
    }
    if (job.attempts > 0) {
      return <Badge variant="outline" className="border-yellow-400 text-yellow-700">Reintentando</Badge>
    }
    return <Badge variant="outline">Pendiente</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pendientes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{stats.processing}</div>
                <div className="text-xs text-muted-foreground">Procesando</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Completados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats.failed}</div>
                <div className="text-xs text-muted-foreground">Fallidos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Cola de Mensajes WhatsApp</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadQueueData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Pending Jobs */}
      {pendingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mensajes Pendientes</CardTitle>
            <CardDescription>
              Los próximos {pendingJobs.length} mensajes en la cola
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getJobTypeIcon(job.type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{getJobTypeName(job.type)}</span>
                        {getStatusBadge(job)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Para: {job.templateData.customerName} • {job.to}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Creado {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: es })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction('prioritize_job', job.id)}
                      disabled={actionLoading === job.id}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction('cancel_job', job.id)}
                      disabled={actionLoading === job.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Jobs */}
      {failedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600">Mensajes Fallidos</CardTitle>
            <CardDescription>
              Mensajes que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center space-x-3">
                    {getJobTypeIcon(job.type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{getJobTypeName(job.type)}</span>
                        {getStatusBadge(job)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Para: {job.templateData.customerName} • {job.to}
                      </div>
                      <div className="text-xs text-red-600">
                        Error: {job.error}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Intentos: {job.attempts}/{job.maxAttempts}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction('retry_job', job.id)}
                      disabled={actionLoading === job.id}
                    >
                      <Play className="h-4 w-4" />
                      Reintentar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const whatsappUrl = `https://wa.me/${job.to.replace(/\D/g, '')}`
                        window.open(whatsappUrl, '_blank')
                      }}
                    >
                      <Phone className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && pendingJobs.length === 0 && failedJobs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No hay mensajes en cola
            </h3>
            <p className="text-sm text-muted-foreground">
              Los mensajes de WhatsApp aparecerán aquí cuando se generen pedidos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
