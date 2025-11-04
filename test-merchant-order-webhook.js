#!/usr/bin/env node

// Script para probar el webhook de merchant_order con los datos del pago real
import fetch from 'node-fetch'

const WEBHOOK_URL = 'https://foodynow.com.ar/api/webhook/mercadopago?tenant=pizzeria-don-mario&topic=merchant_order&id=TEST_MERCHANT_ORDER_123'

// Simular el payload que envía MercadoPago para un merchant_order
const merchantOrderPayload = {
  action: "payment.updated",
  api_version: "v1",
  data: {
    id: "TEST_MERCHANT_ORDER_123"  // ID de prueba para verificar el webhook
  },
  date_created: new Date().toISOString(),
  id: 12345,
  live_mode: false,
  type: "merchant_order",
  user_id: "123456789"
}

async function testMerchantOrderWebhook() {
  console.log('🧪 Probando webhook de merchant_order...')
  console.log('URL:', WEBHOOK_URL)
  console.log('Payload:', JSON.stringify(merchantOrderPayload, null, 2))
  
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
    } else {
      console.log('❌ Error en el webhook')
    }
    
  } catch (error) {
    console.error('💥 Error enviando webhook:', error.message)
  }
}

testMerchantOrderWebhook()
