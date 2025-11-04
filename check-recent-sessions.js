#!/usr/bin/env node

// Script para consultar checkout sessions recientes y órdenes
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRecentSessions() {
  console.log('🔍 Consultando sesiones de checkout recientes...\n')
  
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
  
  // Obtener sesiones recientes (últimas 24 horas)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const { data: sessions, error: sessionsError } = await supabase
    .from('checkout_sessions')
    .select(`
      id,
      external_reference,
      status,
      payment_status,
      payment_id,
      order_id,
      total,
      created_at,
      processed_at,
      preference_id
    `)
    .eq('store_id', store.id)
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
  
  if (sessionsError) {
    console.error('❌ Error consultando sesiones:', sessionsError)
    return
  }
  
  if (!sessions || sessions.length === 0) {
    console.log('📭 No hay sesiones de checkout en las últimas 24 horas')
    return
  }
  
  console.log(`\n📋 SESIONES RECIENTES (${sessions.length}):`)
  console.log('================================================')
  
  for (const session of sessions) {
    console.log(`\n🛒 Sesión: ${session.id}`)
    console.log(`   External Ref: ${session.external_reference}`)
    console.log(`   Status: ${session.status}`)
    console.log(`   Payment Status: ${session.payment_status}`)
    console.log(`   Payment ID: ${session.payment_id || 'N/A'}`)
    console.log(`   Order ID: ${session.order_id || 'N/A'}`)
    console.log(`   Total: $${session.total}`)
    console.log(`   Creada: ${new Date(session.created_at).toLocaleString()}`)
    console.log(`   Procesada: ${session.processed_at ? new Date(session.processed_at).toLocaleString() : 'N/A'}`)
    console.log(`   Preference ID: ${session.preference_id || 'N/A'}`)
    
    // Si tiene order_id, consultar la orden
    if (session.order_id) {
      const { data: order } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_email,
          status,
          payment_status,
          total,
          created_at
        `)
        .eq('id', session.order_id)
        .single()
      
      if (order) {
        console.log(`   \n   📦 ORDEN ASOCIADA:`)
        console.log(`      ID: ${order.id}`)
        console.log(`      Cliente: ${order.customer_name}`)
        console.log(`      Email: ${order.customer_email}`)
        console.log(`      Status: ${order.status}`)
        console.log(`      Payment Status: ${order.payment_status}`)
        console.log(`      Total: $${order.total}`)
        console.log(`      Creada: ${new Date(order.created_at).toLocaleString()}`)
      }
    } else {
      console.log(`   ❌ SIN ORDEN ASOCIADA`)
    }
  }
  
  // Consultar payments recientes también
  console.log(`\n\n💳 PAGOS RECIENTES:`)
  console.log('===================')
  
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id,
      provider_payment_id,
      mp_payment_id,
      status,
      transaction_amount,
      order_id,
      created_at,
      payer_email
    `)
    .eq('store_id', store.id)
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
  
  if (payments && payments.length > 0) {
    for (const payment of payments) {
      console.log(`\n💰 Payment: ${payment.id}`)
      console.log(`   MP Payment ID: ${payment.mp_payment_id}`)
      console.log(`   Provider Payment ID: ${payment.provider_payment_id}`)
      console.log(`   Status: ${payment.status}`)
      console.log(`   Amount: $${payment.transaction_amount}`)
      console.log(`   Order ID: ${payment.order_id || 'N/A'}`)
      console.log(`   Payer: ${payment.payer_email || 'N/A'}`)
      console.log(`   Creado: ${new Date(payment.created_at).toLocaleString()}`)
    }
  } else {
    console.log('📭 No hay pagos registrados en las últimas 24 horas')
  }
}

checkRecentSessions().catch(console.error)
