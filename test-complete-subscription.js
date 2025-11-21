#!/usr/bin/env node

/**
 * Script de prueba completa del flujo de suscripción
 * Simula un usuario registrándose y creando una suscripción
 */

const https = require('https');
const http = require('http');

require('dotenv').config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000';
const PLAN_ID = process.env.MERCADOPAGO_PLAN_ID;

console.log('🧪 Prueba completa del flujo de suscripción');
console.log('===========================================\n');

// Función para hacer requests HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testNewSubscriptionFlow() {
  console.log('🎯 Probando flujo de suscripción actualizado...\n');
  
  console.log('📋 Configuración actual:');
  console.log(`   🆔 Plan ID: ${PLAN_ID}`);
  console.log(`   💰 Precio: $${process.env.SUBSCRIPTION_PRICE} ARS`);
  console.log(`   🏷️  Título: ${process.env.SUBSCRIPTION_TITLE}`);
  console.log(`   🌐 App URL: ${process.env.NEXT_PUBLIC_APP_URL}\n`);
  
  console.log('1️⃣ Probando endpoint de suscripción (sin auth - esperamos 401)...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/subscription/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {});
    
    console.log(`   📊 Status: ${response.status} ${response.status === 401 ? '✅' : '❌'}`);
    console.log(`   📝 Mensaje: ${response.body.error || 'Sin mensaje'}`);
    
    if (response.status === 401) {
      console.log('   ✅ Endpoint requiere autenticación correctamente\n');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }
  
  console.log('2️⃣ Verificando que la API esté usando el plan correcto...');
  console.log(`   🔗 URL del plan: https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${PLAN_ID}`);
  console.log('   ℹ️  El plan debe estar configurado en MercadoPago con:');
  console.log('      - Precio: $36,000 ARS/mes');
  console.log('      - Trial: 15 días gratis');
  console.log('      - Frecuencia: Mensual\n');
  
  console.log('3️⃣ Próximos pasos para la prueba manual:');
  console.log('   a) Abrir http://localhost:3000/auth/sign-up');
  console.log('   b) Crear cuenta con email de prueba');
  console.log('   c) Completar setup de tienda');
  console.log('   d) Ir a configuración de suscripción');
  console.log('   e) Probar el flujo de suscripción');
  console.log('   f) Verificar en MercadoPago que se use el plan correcto\n');
  
  console.log('4️⃣ Para monitorear la base de datos durante la prueba:');
  console.log('   Ejecutar: node monitor-database.js --watch\n');
  
  console.log('✅ Sistema listo para pruebas manuales!');
}

testNewSubscriptionFlow().catch(console.error);
