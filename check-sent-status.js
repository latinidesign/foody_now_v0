#!/usr/bin/env node

// Script para verificar y mostrar los estados actuales de orders
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estados actuales en la base de datos...')
    
    // Consultar estados únicos existentes en orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status')
    
    if (error) {
      console.error('❌ Error al consultar orders:', error)
      return
    }
    
    // Obtener valores únicos de status
    const uniqueStatuses = [...new Set(orders.map(order => order.status))].sort()
    
    console.log('📋 Estados actualmente en uso en la tabla orders:')
    uniqueStatuses.forEach(status => console.log(`   - ${status}`))
    
    // Verificar si 'sent' existe
    if (uniqueStatuses.includes('sent')) {
      console.log('✅ El estado "sent" ya está disponible en la base de datos')
    } else {
      console.log('⚠️  El estado "sent" NO está disponible en la base de datos')
      console.log('\n🔧 Para solucionarlo, ejecuta en Supabase SQL Editor:')
      console.log("   ALTER TYPE order_status ADD VALUE 'sent' AFTER 'ready';")
      console.log('\n📍 URL de Supabase SQL Editor:')
      console.log('   https://brubhbfkzehcqclivaxb.supabase.co/project/default/sql')
    }
    
    // Intentar crear un pedido test con estado 'sent'
    console.log('\n🧪 Probando si se puede usar el estado "sent"...')
    
    // Usar un UUID válido
    const testOrderId = '550e8400-e29b-41d4-a716-446655440000'
    const { data: testInsert, error: insertError } = await supabase
      .from('orders')
      .insert({
        id: testOrderId,
        store_id: 'cm4igg5b7003chjz4zcjwsmiy', // ID de prueba
        customer_name: 'Test Sent Status',
        customer_phone: '+5491123456789',
        delivery_type: 'delivery',
        subtotal: 1000,
        total: 1000,
        status: 'sent'
      })
      .select()
    
    if (insertError) {
      console.error('❌ No se puede usar el estado "sent":', insertError.message)
      if (insertError.message.includes('invalid input value for enum')) {
        console.log('✨ Esto confirma que necesitas agregar "sent" al ENUM en la base de datos')
      }
    } else {
      console.log('✅ El estado "sent" funciona correctamente')
      
      // Limpiar el registro de prueba
      await supabase.from('orders').delete().eq('id', testOrderId)
      console.log('🧹 Registro de prueba eliminado')
    }
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

checkDatabase()
  .then(() => {
    console.log('\n🎉 Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
