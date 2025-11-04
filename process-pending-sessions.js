#!/usr/bin/env node

// Script para procesar manualmente las sesiones pendientes que no se convirtieron en órdenes
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function processPendingSessions() {
  console.log('🔧 Procesando sesiones pendientes...\n')
  
  // Obtener tienda
  const { data: store } = await supabase
    .from('stores')
    .select('id, name, slug')
    .eq('slug', 'pizzeria-don-mario')
    .single()
  
  if (!store) {
    console.log('❌ No se encontró la tienda pizzeria-don-mario')
    return
  }
  
  console.log(`🏪 Tienda: ${store.name} (${store.slug})`)
  
  // Obtener sesiones pendientes que deberían haberse procesado
  const { data: pendingSessions, error: sessionsError } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('store_id', store.id)
    .eq('status', 'pending')
    .is('order_id', null)
    .not('preference_id', 'is', null)
    .order('created_at', { ascending: false })
  
  if (sessionsError) {
    console.error('❌ Error consultando sesiones pendientes:', sessionsError)
    return
  }
  
  if (!pendingSessions || pendingSessions.length === 0) {
    console.log('✅ No hay sesiones pendientes sin procesar')
    return
  }
  
  console.log(`\n📋 SESIONES PENDIENTES A PROCESAR: ${pendingSessions.length}`)
  console.log('================================================')
  
  for (const session of pendingSessions) {
    console.log(`\n🔄 Procesando sesión: ${session.id}`)
    console.log(`   External Ref: ${session.external_reference}`)
    console.log(`   Total: $${session.total}`)
    console.log(`   Preference ID: ${session.preference_id}`)
    
    try {
      // Crear la orden manualmente
      const orderData = session.order_data
      const sessionItems = session.items
      
      if (!orderData || !sessionItems) {
        console.log(`   ❌ Faltan datos de orden o items`)
        continue
      }
      
      console.log(`   👤 Cliente: ${orderData.customerName}`)
      console.log(`   📧 Email: ${orderData.customerEmail}`)
      
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
          payment_status: "completed", // Asumimos que el pago se completó
        })
        .select("*")
        .single()

      if (orderError || !order) {
        console.log(`   ❌ Error creando orden:`, orderError)
        continue
      }

      console.log(`   ✅ Orden creada: ${order.id}`)

      // Crear order_items
      if (sessionItems.length > 0) {
        const orderItems = sessionItems.map((item) => ({
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
          console.log(`   ❌ Error creando items:`, itemsError)
        } else {
          console.log(`   ✅ Items creados: ${orderItems.length}`)
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
        console.log(`   ❌ Error actualizando sesión:`, updateError)
      } else {
        console.log(`   ✅ Sesión actualizada`)
      }
      
      console.log(`   🎉 ORDEN PROCESADA EXITOSAMENTE`)
      
    } catch (error) {
      console.error(`   💥 Error procesando sesión:`, error)
    }
  }
  
  console.log(`\n🏁 Procesamiento completado`)
}

processPendingSessions().catch(console.error)
