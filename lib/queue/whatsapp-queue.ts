export interface WhatsAppMessageJob {
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
    items?: Array<{
      name: string
      quantity: number
      price: number
    }>
    deliveryType?: 'pickup' | 'delivery'
    deliveryAddress?: string
  }
  attempts: number
  maxAttempts: number
  scheduledAt: string
  createdAt: string
  processedAt?: string
  failedAt?: string
  error?: string
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
}

class WhatsAppQueue {
  private queue: WhatsAppMessageJob[] = []
  private processing: Set<string> = new Set()
  private isRunning = false
  private processingInterval?: NodeJS.Timeout
  private readonly MAX_CONCURRENT_JOBS = 3 // Límite de trabajos concurrentes
  private readonly PROCESS_INTERVAL = 1500 // 1.5 segundos entre procesos

  // Add message to queue
  async enqueue(job: Omit<WhatsAppMessageJob, 'id' | 'attempts' | 'createdAt'>): Promise<string> {
    const messageJob: WhatsAppMessageJob = {
      ...job,
      id: `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attempts: 0,
      createdAt: new Date().toISOString(),
    }

    this.queue.push(messageJob)
    console.log(`[WhatsAppQueue] Enqueued message ${messageJob.id} for ${messageJob.to}`)
    
    // Start processing if not already running
    if (!this.isRunning) {
      this.startProcessing()
    }

    return messageJob.id
  }

  // Start queue processing
  private startProcessing() {
    if (this.isRunning) return

    this.isRunning = true
    console.log('[WhatsAppQueue] Started processing')

    this.processingInterval = setInterval(async () => {
      await this.processNext()
    }, this.PROCESS_INTERVAL)
  }

  // Stop queue processing
  stopProcessing() {
    this.isRunning = false
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = undefined
    }
    console.log('[WhatsAppQueue] Stopped processing')
  }

  // Process next message in queue
  private async processNext() {
    const now = new Date()
    
    // Limitar trabajos concurrentes
    if (this.processing.size >= this.MAX_CONCURRENT_JOBS) {
      return
    }
    
    // Find next eligible jobs (procesar múltiples si hay capacidad)
    const eligibleJobs = this.queue.filter(job => 
      !this.processing.has(job.id) && 
      !job.processedAt && 
      job.attempts < job.maxAttempts &&
      new Date(job.scheduledAt) <= now
    ).slice(0, this.MAX_CONCURRENT_JOBS - this.processing.size)

    if (eligibleJobs.length === 0) return

    // Procesar trabajos en paralelo
    const promises = eligibleJobs.map(job => this.processJob(job))
    await Promise.allSettled(promises)
  }

  // Process individual job
  private async processJob(job: WhatsAppMessageJob) {
    this.processing.add(job.id)
    console.log(`[WhatsAppQueue] Processing job ${job.id} (${job.type})`)

    try {
      await this.processMessage(job)
      
      // Mark as completed
      job.processedAt = new Date().toISOString()
      console.log(`[WhatsAppQueue] ✅ Completed job ${job.id}`)
      
    } catch (error) {
      job.attempts++
      job.error = error instanceof Error ? error.message : 'Unknown error'
      
      if (job.attempts >= job.maxAttempts) {
        job.failedAt = new Date().toISOString()
        console.error(`[WhatsAppQueue] ❌ Job ${job.id} failed permanently:`, job.error)
      } else {
        // Schedule retry with exponential backoff
        const delayMs = Math.min(1000 * Math.pow(2, job.attempts), 60000) // Max 1 minuto
        job.scheduledAt = new Date(Date.now() + delayMs).toISOString()
        console.warn(`[WhatsAppQueue] ⚠️ Job ${job.id} failed, retry ${job.attempts}/${job.maxAttempts} in ${delayMs}ms`)
      }
    } finally {
      this.processing.delete(job.id)
    }
  }

  // Process individual message
  private async processMessage(job: WhatsAppMessageJob) {
    // Import WhatsApp service dynamically to avoid circular deps
    const { whatsappService } = await import('@/lib/whatsapp/client')
    const { createAdminClient } = await import('@/lib/supabase/admin')

    const supabase = createAdminClient()

    // Get store settings for WhatsApp credentials
    const { data: storeSettings } = await supabase
      .from('store_settings')
      .select('wa_phone_number_id, wa_access_token, wa_api_version')
      .eq('store_id', job.storeId)
      .single()

    if (!storeSettings?.wa_phone_number_id || !storeSettings?.wa_access_token) {
      throw new Error('WhatsApp credentials not configured for store')
    }

    // Build message based on type
    let message: string
    switch (job.type) {
      case 'customer_confirmation':
        message = this.buildConfirmationMessage(job.templateData)
        break
      case 'status_update':
        message = this.buildStatusUpdateMessage(job.templateData)
        break
      case 'delivery_notification':
        message = this.buildDeliveryMessage(job.templateData)
        break
      default:
        throw new Error(`Unknown message type: ${job.type}`)
    }

    // Send via WhatsApp Cloud API
    const result = await whatsappService.sendTextMessage(job.to, message, {
      credentials: {
        waPhoneNumberId: storeSettings.wa_phone_number_id,
        waAccessToken: storeSettings.wa_access_token,
        apiVersion: storeSettings.wa_api_version,
      }
    })

    if (!result.success) {
      throw new Error(result.error || 'WhatsApp send failed')
    }

    // Log successful send
    console.log(`[WhatsAppQueue] Sent ${job.type} to ${job.to} for order ${job.orderId}`)
  }

  // Message builders
  private buildConfirmationMessage(data: WhatsAppMessageJob['templateData']): string {
    const itemsList = data.items?.map(item => 
      `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n') || ''

    const deliveryInfo = data.deliveryType === 'delivery' 
      ? `📍 Delivery: ${data.deliveryAddress}`
      : '🏪 Retiro en local'

    return `✅ *Pedido Confirmado*

¡Hola ${data.customerName}! Tu pedido en ${data.storeName} ha sido confirmado.

📦 *Productos:*
${itemsList}

💰 *Total: $${data.total?.toFixed(2) || '0.00'}*

${deliveryInfo}
⏰ Tiempo estimado: ${data.estimatedTime || '30-45 min'}

¡Te notificaremos cuando esté listo!`
  }

  private buildStatusUpdateMessage(data: WhatsAppMessageJob['templateData']): string {
    const statusMessages = {
      preparing: '👨‍🍳 *Tu pedido está siendo preparado*',
      ready: '✅ *¡Tu pedido está listo!*',
      delivered: '🎉 *¡Pedido entregado!*',
      cancelled: '❌ *Pedido cancelado*'
    }

    const statusText = statusMessages[data.orderStatus as keyof typeof statusMessages] || '*Actualización de pedido*'

    return `${statusText}

¡Hola ${data.customerName}!

${data.orderStatus === 'ready' && data.deliveryType === 'pickup' 
  ? 'Puedes pasar a retirar tu pedido cuando gustes.'
  : data.orderStatus === 'delivered'
  ? '¡Esperamos que disfrutes tu pedido!'
  : data.orderStatus === 'cancelled'
  ? 'Disculpas por las molestias. Si tienes dudas, contáctanos.'
  : 'Te mantendremos informado sobre el progreso.'
}

Gracias por elegirnos - ${data.storeName}`
  }

  private buildDeliveryMessage(data: WhatsAppMessageJob['templateData']): string {
    return `🚗 *Tu pedido está en camino*

¡Hola ${data.customerName}!

Tu pedido de ${data.storeName} ha salido para entrega.
📍 Dirección: ${data.deliveryAddress}

⏰ Llegada estimada: ${data.estimatedTime || '15-20 min'}

¡Esperamos que disfrutes tu pedido!`
  }

  // Get queue statistics
  getStats(): QueueStats {
    return {
      pending: this.queue.filter(job => !job.processedAt && !job.failedAt && job.attempts < job.maxAttempts).length,
      processing: this.processing.size,
      completed: this.queue.filter(job => job.processedAt).length,
      failed: this.queue.filter(job => job.failedAt).length,
    }
  }

  // Clear completed/failed jobs (cleanup)
  cleanup(olderThanHours = 24) {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    const initialLength = this.queue.length
    
    this.queue = this.queue.filter(job => {
      const jobDate = new Date(job.createdAt)
      return jobDate > cutoff || (!job.processedAt && !job.failedAt)
    })

    const removed = initialLength - this.queue.length
    if (removed > 0) {
      console.log(`[WhatsAppQueue] Cleaned up ${removed} old jobs`)
    }
  }

  // Obtener trabajos por estado
  getJobsByStatus(status: 'pending' | 'processing' | 'completed' | 'failed'): WhatsAppMessageJob[] {
    switch (status) {
      case 'pending':
        return this.queue.filter(job => !job.processedAt && !job.failedAt && job.attempts < job.maxAttempts)
      case 'processing':
        return this.queue.filter(job => this.processing.has(job.id))
      case 'completed':
        return this.queue.filter(job => job.processedAt)
      case 'failed':
        return this.queue.filter(job => job.failedAt)
      default:
        return []
    }
  }

  // Obtener trabajo por ID
  getJobById(id: string): WhatsAppMessageJob | undefined {
    return this.queue.find(job => job.id === id)
  }

  // Cancelar trabajo pendiente
  cancelJob(id: string): boolean {
    const job = this.queue.find(job => job.id === id)
    if (job && !job.processedAt && !job.failedAt && !this.processing.has(job.id)) {
      job.failedAt = new Date().toISOString()
      job.error = 'Cancelled by user'
      console.log(`[WhatsAppQueue] Job ${id} cancelled`)
      return true
    }
    return false
  }

  // Reintentar trabajo fallido
  retryJob(id: string): boolean {
    const job = this.queue.find(job => job.id === id)
    if (job && job.failedAt) {
      job.failedAt = undefined
      job.error = undefined
      job.attempts = 0
      job.scheduledAt = new Date().toISOString()
      console.log(`[WhatsAppQueue] Job ${id} scheduled for retry`)
      return true
    }
    return false
  }

  // Priorizar trabajo (mover al principio de la cola)
  prioritizeJob(id: string): boolean {
    const jobIndex = this.queue.findIndex(job => job.id === id)
    if (jobIndex > 0) {
      const job = this.queue.splice(jobIndex, 1)[0]
      this.queue.unshift(job)
      console.log(`[WhatsAppQueue] Job ${id} prioritized`)
      return true
    }
    return false
  }
}

export const whatsappQueue = new WhatsAppQueue()

// Helper functions for common use cases
export const enqueueCustomerConfirmation = async (params: {
  orderId: string
  storeId: string
  customerPhone: string
  customerName: string
  storeName: string
  total: number
  items: Array<{ name: string; quantity: number; price: number }>
  deliveryType: 'pickup' | 'delivery'
  deliveryAddress?: string
  estimatedTime?: string
}) => {
  return whatsappQueue.enqueue({
    type: 'customer_confirmation',
    to: params.customerPhone,
    storeId: params.storeId,
    orderId: params.orderId,
    templateData: {
      customerName: params.customerName,
      storeName: params.storeName,
      total: params.total,
      items: params.items,
      deliveryType: params.deliveryType,
      deliveryAddress: params.deliveryAddress,
      estimatedTime: params.estimatedTime || '30-45 min',
    },
    maxAttempts: 3,
    scheduledAt: new Date().toISOString(),
  })
}

export const enqueueStatusUpdate = async (params: {
  orderId: string
  storeId: string
  customerPhone: string
  customerName: string
  storeName: string
  orderStatus: string
  deliveryType?: 'pickup' | 'delivery'
  estimatedTime?: string
}) => {
  return whatsappQueue.enqueue({
    type: 'status_update',
    to: params.customerPhone,
    storeId: params.storeId,
    orderId: params.orderId,
    templateData: {
      customerName: params.customerName,
      storeName: params.storeName,
      orderStatus: params.orderStatus,
      deliveryType: params.deliveryType,
      estimatedTime: params.estimatedTime,
    },
    maxAttempts: 3,
    scheduledAt: new Date().toISOString(),
  })
}

export const enqueueDeliveryNotification = async (params: {
  orderId: string
  storeId: string
  customerPhone: string
  customerName: string
  storeName: string
  deliveryAddress: string
  estimatedTime?: string
}) => {
  return whatsappQueue.enqueue({
    type: 'delivery_notification',
    to: params.customerPhone,
    storeId: params.storeId,
    orderId: params.orderId,
    templateData: {
      customerName: params.customerName,
      storeName: params.storeName,
      deliveryAddress: params.deliveryAddress,
      estimatedTime: params.estimatedTime || '15-20 min',
    },
    maxAttempts: 3,
    scheduledAt: new Date().toISOString(),
  })
}

// Helper para cambios de estado de pedido
export const notifyOrderStatusChange = async (params: {
  orderId: string
  storeId: string
  newStatus: 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  customerPhone: string
  customerName: string
  storeName: string
  deliveryType?: 'pickup' | 'delivery'
  deliveryAddress?: string
  estimatedTime?: string
}) => {
  const { newStatus, deliveryType, deliveryAddress, ...baseParams } = params

  // Envío específico según el nuevo estado
  switch (newStatus) {
    case 'preparing':
      return enqueueStatusUpdate({
        ...baseParams,
        orderStatus: 'preparing',
        deliveryType,
        estimatedTime: params.estimatedTime || '30-45 min',
      })

    case 'ready':
      return enqueueStatusUpdate({
        ...baseParams,
        orderStatus: 'ready',
        deliveryType,
        estimatedTime: deliveryType === 'pickup' ? 'Disponible para retiro' : params.estimatedTime,
      })

    case 'out_for_delivery':
      if (deliveryType === 'delivery' && deliveryAddress) {
        return enqueueDeliveryNotification({
          ...baseParams,
          deliveryAddress,
          estimatedTime: params.estimatedTime || '15-20 min',
        })
      }
      break

    case 'delivered':
      return enqueueStatusUpdate({
        ...baseParams,
        orderStatus: 'delivered',
        deliveryType,
      })

    case 'cancelled':
      return enqueueStatusUpdate({
        ...baseParams,
        orderStatus: 'cancelled',
        deliveryType,
      })
  }
}
