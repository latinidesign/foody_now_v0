#!/usr/bin/env node

// Script para agregar el estado 'sent' al ENUM order_status
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSentStatus() {
  try {
    console.log('🔄 Agregando estado "sent" al ENUM order_status...')
    
    // Ejecutar el ALTER TYPE para agregar 'sent'
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: "ALTER TYPE order_status ADD VALUE 'sent' AFTER 'ready';"
    })
    
    if (error) {
      // Si el error es que el valor ya existe, está bien
      if (error.message.includes('already exists')) {
        console.log('✅ El estado "sent" ya existe en el ENUM order_status')
        return
      }
      throw error
    }
    
    console.log('✅ Estado "sent" agregado exitosamente al ENUM order_status')
    
    // Verificar los valores del ENUM
    const { data: enumValues, error: enumError } = await supabase.rpc('exec_sql', {
      sql: "SELECT unnest(enum_range(NULL::order_status)) AS status_values;"
    })
    
    if (!enumError) {
      console.log('📋 Valores actuales del ENUM order_status:')
      enumValues.forEach(row => console.log(`   - ${row.status_values}`))
    }
    
  } catch (error) {
    console.error('❌ Error al actualizar el ENUM:', error)
    
    // Intentar con método alternativo usando SQL directo
    console.log('🔄 Intentando método alternativo...')
    try {
      const { data, error: directError } = await supabase
        .from('orders')
        .select('id')
        .limit(1)
      
      if (directError) {
        console.error('❌ Error de conexión:', directError)
        return
      }
      
      console.log('✅ Conexión a la base de datos exitosa')
      console.log('⚠️  Necesitas ejecutar manualmente en Supabase SQL Editor:')
      console.log("   ALTER TYPE order_status ADD VALUE 'sent' AFTER 'ready';")
      
    } catch (directError) {
      console.error('❌ Error de conexión directa:', directError)
    }
  }
}

addSentStatus()
  .then(() => {
    console.log('🎉 Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
