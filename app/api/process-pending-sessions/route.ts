import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST() {
  const supabase = createAdminClient()
  
  console.log('🔧 Processing pending checkout sessions...')
  
  try {
    // Obtener tienda
    const { data: store } = await supabase
      .from('stores')
      .select('id, name, slug')
      .eq('slug', 'pizzeria-don-mario')
      .single()
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }
    
    // Obtener sesiones pendientes
    const { data: pendingSessions, error: sessionsError } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('store_id', store.id)
      .eq('status', 'pending')
      .is('order_id', null)
      .not('preference_id', 'is', null)
      .order('created_at', { ascending: false })
    
    if (sessionsError) {
      return NextResponse.json({ error: 'Failed to fetch sessions', details: sessionsError }, { status: 500 })
    }
    
    if (!pendingSessions || pendingSessions.length === 0) {
      return NextResponse.json({ message: 'No pending sessions to process', processed: 0 })
    }
    
    let processed = 0
    const results = []
    
    for (const session of pendingSessions) {
      try {
        const orderData = session.order_data
        const sessionItems = session.items
        
        if (!orderData || !sessionItems) {
          results.push({ sessionId: session.id, status: 'skipped', reason: 'Missing data' })
          continue
        }
        
        // Crear la orden
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            store_id: store.id,
            customer_name: orderData.customerName,
            customer_email: orderData.customerEmail,
            customer_phone: orderData.customerPhone,
            delivery_type: orderData.deliveryType,
            delivery_address: orderData.deliveryAddress,
            delivery_notes: orderData.deliveryNotes,
            subtotal: session.subtotal ?? 0,
            delivery_fee: session.delivery_fee ?? 0,
            total: session.total ?? 0,
            status: "confirmed",
            payment_status: "completed",
          })
          .select("*")
          .single()

        if (orderError || !order) {
          results.push({ sessionId: session.id, status: 'error', reason: 'Failed to create order', error: orderError })
          continue
        }

        // Crear order_items
        if (sessionItems.length > 0) {
          const orderItems = sessionItems.map((item: any) => ({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            selected_options: item.selectedOptions ?? null,
          }))

          const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems)

          if (itemsError) {
            results.push({ sessionId: session.id, status: 'partial', reason: 'Order created but items failed', error: itemsError })
            continue
          }
        }

        // Actualizar checkout_session
        const { error: updateError } = await supabase
          .from("checkout_sessions")
          .update({
            order_id: order.id,
            status: "approved",
            payment_status: "completed",
            processed_at: new Date().toISOString(),
          })
          .eq("id", session.id)

        if (updateError) {
          results.push({ sessionId: session.id, status: 'partial', reason: 'Order created but session update failed', error: updateError })
          continue
        }
        
        results.push({ 
          sessionId: session.id, 
          orderId: order.id,
          status: 'success',
          customer: orderData.customerName,
          total: session.total
        })
        processed++
        
      } catch (error) {
        results.push({ sessionId: session.id, status: 'error', reason: 'Unexpected error', error: String(error) })
      }
    }
    
    return NextResponse.json({ 
      message: `Processing completed`, 
      processed,
      total: pendingSessions.length,
      results 
    })
    
  } catch (error) {
    console.error('Error processing pending sessions:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
