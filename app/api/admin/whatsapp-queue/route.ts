import { NextRequest, NextResponse } from 'next/server'
import { whatsappQueue, notifyOrderStatusChange } from '@/lib/queue/whatsapp-queue'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// GET - Obtener estadísticas y trabajos de la cola
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const storeId = url.searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 })
    }

    switch (action) {
      case 'stats':
        const stats = whatsappQueue.getStats()
        return NextResponse.json({ stats })

      case 'jobs':
        const status = url.searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'failed' | null
        const jobs = status ? whatsappQueue.getJobsByStatus(status) : []
        
        // Filtrar por storeId
        const filteredJobs = jobs.filter(job => job.storeId === storeId)
        
        return NextResponse.json({ jobs: filteredJobs })

      case 'job':
        const jobId = url.searchParams.get('jobId')
        if (!jobId) {
          return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
        }
        
        const job = whatsappQueue.getJobById(jobId)
        if (!job || job.storeId !== storeId) {
          return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }
        
        return NextResponse.json({ job })

      default:
        const allStats = whatsappQueue.getStats()
        const pendingJobs = whatsappQueue.getJobsByStatus('pending').filter(job => job.storeId === storeId)
        const processingJobs = whatsappQueue.getJobsByStatus('processing').filter(job => job.storeId === storeId)
        const failedJobs = whatsappQueue.getJobsByStatus('failed').filter(job => job.storeId === storeId)
        
        return NextResponse.json({
          stats: allStats,
          storeJobs: {
            pending: pendingJobs.length,
            processing: processingJobs.length,
            failed: failedJobs.length,
          },
          recentJobs: {
            pending: pendingJobs.slice(0, 5),
            failed: failedJobs.slice(0, 5),
          }
        })
    }
  } catch (error) {
    console.error('[API] WhatsApp Queue GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Acciones sobre la cola
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, storeId, ...params } = body

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 })
    }

    switch (action) {
      case 'notify_status_change':
        const { orderId, newStatus, customerPhone, customerName, storeName, deliveryType, deliveryAddress, estimatedTime } = params
        
        if (!orderId || !newStatus || !customerPhone || !customerName || !storeName) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const jobId = await notifyOrderStatusChange({
          orderId,
          storeId,
          newStatus,
          customerPhone,
          customerName,
          storeName,
          deliveryType,
          deliveryAddress,
          estimatedTime,
        })

        return NextResponse.json({ success: true, jobId })

      case 'retry_job':
        const { jobId: retryJobId } = params
        if (!retryJobId) {
          return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
        }

        const job = whatsappQueue.getJobById(retryJobId)
        if (!job || job.storeId !== storeId) {
          return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        const retried = whatsappQueue.retryJob(retryJobId)
        return NextResponse.json({ success: retried })

      case 'cancel_job':
        const { jobId: cancelJobId } = params
        if (!cancelJobId) {
          return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
        }

        const jobToCancel = whatsappQueue.getJobById(cancelJobId)
        if (!jobToCancel || jobToCancel.storeId !== storeId) {
          return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        const cancelled = whatsappQueue.cancelJob(cancelJobId)
        return NextResponse.json({ success: cancelled })

      case 'prioritize_job':
        const { jobId: prioritizeJobId } = params
        if (!prioritizeJobId) {
          return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
        }

        const jobToPrioritize = whatsappQueue.getJobById(prioritizeJobId)
        if (!jobToPrioritize || jobToPrioritize.storeId !== storeId) {
          return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        const prioritized = whatsappQueue.prioritizeJob(prioritizeJobId)
        return NextResponse.json({ success: prioritized })

      case 'cleanup':
        const { olderThanHours = 24 } = params
        whatsappQueue.cleanup(olderThanHours)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[API] WhatsApp Queue POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Endpoint para actualizar estado de pedido y notificar cliente
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, newStatus, storeId, estimatedTime } = body

    if (!orderId || !newStatus || !storeId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Obtener datos del pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_phone,
        delivery_type,
        delivery_address,
        status,
        stores!inner (
          id,
          name
        )
      `)
      .eq('id', orderId)
      .eq('store_id', storeId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Actualizar estado en la base de datos
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        ...(estimatedTime && { estimated_time: estimatedTime })
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order status:', updateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Enviar notificación WhatsApp si el cliente tiene teléfono
    let jobId = null
    if (order.customer_phone) {
      jobId = await notifyOrderStatusChange({
        orderId: order.id,
        storeId,
        newStatus,
        customerPhone: order.customer_phone,
        customerName: order.customer_name,
        storeName: (order.stores as any).name,
        deliveryType: order.delivery_type as 'pickup' | 'delivery',
        deliveryAddress: order.delivery_address,
        estimatedTime,
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order status updated',
      jobId,
      notificationSent: !!jobId
    })

  } catch (error) {
    console.error('[API] Order status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
