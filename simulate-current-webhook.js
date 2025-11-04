#!/usr/bin/env node

// Script para simular el webhook específico de la sesión actual
// Usando fetch nativo de Node.js (disponible desde v18+)

// Datos de la sesión actual que acabas de crear
const SESSION_ID = '01caac25-37ec-48e4-8119-90c1db042c0e'
const EXTERNAL_REF = '09b69176-e684-4bf0-a293-9257eb92a413'
const PAYMENT_ID = '132478987908' // Del comprobante de MP

const WEBHOOK_URL = `https://foodynow.com.ar/api/webhook/mercadopago?tenant=pizzeria-don-mario&topic=merchant_order&id=TEST_MO_${PAYMENT_ID}`

// Simular el payload que envía MercadoPago para un merchant_order
const merchantOrderPayload = {
  action: "payment.updated",
  api_version: "v1",
  data: {
    id: `TEST_MO_${PAYMENT_ID}`  // ID simulado basado en el payment real
  },
  date_created: "2025-11-04T15:33:01.000Z", // Hora del comprobante
  id: 12345,
  live_mode: false,
  type: "merchant_order",
  user_id: "123456789"
}

async function simulateWebhook() {
  console.log('🧪 Simulando webhook para la sesión actual...')
  console.log(`📊 Sesión ID: ${SESSION_ID}`)
  console.log(`🔗 External Ref: ${EXTERNAL_REF}`)
  console.log(`💳 Payment ID: ${PAYMENT_ID}`)
  console.log(`🌐 URL: ${WEBHOOK_URL}`)
  console.log(`📦 Payload:`, JSON.stringify(merchantOrderPayload, null, 2))
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoPago Feed v2.0'
      },
      body: JSON.stringify(merchantOrderPayload)
    })
    
    const responseText = await response.text()
    
    console.log('\n📋 RESULTADO:')
    console.log('Status:', response.status)
    console.log('Response:', responseText)
    
    if (response.ok) {
      console.log('✅ Webhook procesado exitosamente')
      console.log('\n🔍 Verifica ahora si apareció la orden...')
    } else {
      console.log('❌ Error en el webhook')
    }
    
  } catch (error) {
    console.error('💥 Error enviando webhook:', error.message)
  }
}

simulateWebhook()
