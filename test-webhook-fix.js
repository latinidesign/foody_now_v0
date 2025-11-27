#!/usr/bin/env node

// Script para probar el webhook de MercadoPago después de las correcciones

const webhookUrl = 'https://foodynow.com.ar/api/webhook/mercadopago?store_slug=pizzeria-don-mario';

const testPayload = {
  action: "payment.updated",
  api_version: "v1", 
  data: {
    id: "TEST_PAYMENT_" + Date.now()
  },
  date_created: new Date().toISOString(),
  id: 12345,
  live_mode: false,
  type: "payment",
  user_id: "123456789"
};

async function testWebhook() {
  console.log('🧪 Probando webhook después de las correcciones...\n');
  console.log('📍 URL:', webhookUrl);
  console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoPago Feed v2.0'
      },
      body: JSON.stringify(testPayload)
    });
    
    const responseText = await response.text();
    
    console.log('\n📊 RESULTADO:');
    console.log('Status:', response.status);
    console.log('Response:', responseText);
    
    if (response.status === 200) {
      console.log('✅ El endpoint de webhook responde correctamente');
    } else {
      console.log('❌ El webhook tiene problemas:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Error conectando al webhook:', error.message);
    console.log('💡 Esto es normal si la app no está corriendo en producción');
  }
}

console.log('🎯 CORRECCIONES APLICADAS:');
console.log('1. ✅ URL webhook: /api/webhooks/ → /api/webhook/ (corregida)');
console.log('2. ✅ APP_BASE_URL: localhost → https://foodynow.com.ar');
console.log('3. ✅ Variables de entorno sincronizadas');
console.log('\n⚠️  RECUERDA: Actualizar estas variables en Vercel también\n');

testWebhook();
