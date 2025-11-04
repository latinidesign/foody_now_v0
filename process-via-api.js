#!/usr/bin/env node

// Script para procesar sesiones pendientes usando el endpoint API
console.log('🔧 Procesando sesiones pendientes vía API...')

const ENDPOINT_URL = 'https://foodynow.com.ar/api/process-pending-sessions'

async function processViaProdAPI() {
  try {
    const response = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const result = await response.json()
    
    console.log('\n📋 RESULTADO:')
    console.log('Status:', response.status)
    
    if (response.ok) {
      console.log('✅ Procesamiento exitoso')
      console.log(`📊 Procesadas: ${result.processed} de ${result.total}`)
      
      if (result.results && result.results.length > 0) {
        console.log('\n📋 DETALLES:')
        result.results.forEach((r, i) => {
          console.log(`${i + 1}. Sesión: ${r.sessionId}`)
          console.log(`   Status: ${r.status}`)
          if (r.orderId) console.log(`   Orden ID: ${r.orderId}`)
          if (r.customer) console.log(`   Cliente: ${r.customer}`)
          if (r.total) console.log(`   Total: $${r.total}`)
          if (r.reason) console.log(`   Razón: ${r.reason}`)
          console.log('')
        })
      }
    } else {
      console.log('❌ Error en el procesamiento')
      console.log('Error:', result.error)
      if (result.details) console.log('Detalles:', result.details)
    }
    
  } catch (error) {
    console.error('💥 Error llamando al endpoint:', error.message)
  }
}

processViaProdAPI()
