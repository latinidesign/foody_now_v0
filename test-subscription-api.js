#!/usr/bin/env node

/**
 * Script de prueba para la API de suscripciones
 * Simula una llamada real a la API
 */

const https = require('https');
const http = require('http');

// Configuración de prueba
const API_BASE = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@foodynow.com',
  password: 'TestPassword123!'
};

console.log('🧪 Iniciando pruebas de API de suscripciones...\n');

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

// Test 1: Verificar que la API esté corriendo
async function testHealthCheck() {
  console.log('1️⃣ Verificando que la API esté activa...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log('   ✅ API está activa');
      return true;
    } else {
      console.log('   ❌ API no responde correctamente:', response.status);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error conectando con la API:', error.message);
    return false;
  }
}

// Test 2: Probar creación de suscripción (sin autenticación - esperamos error 401)
async function testSubscriptionEndpoint() {
  console.log('\n2️⃣ Probando endpoint de suscripción...');
  
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
    
    console.log(`   📊 Status: ${response.status}`);
    console.log(`   📝 Response:`, response.body);
    
    if (response.status === 401) {
      console.log('   ✅ Endpoint funciona correctamente (requiere autenticación)');
      return true;
    } else {
      console.log('   ⚠️  Respuesta inesperada');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    return false;
  }
}

// Test 3: Verificar configuración de MercadoPago
async function testMercadoPagoConfig() {
  console.log('\n3️⃣ Verificando configuración de MercadoPago...');
  
  const requiredEnvVars = [
    'MERCADOPAGO_ACCESS_TOKEN',
    'MERCADOPAGO_PLAN_ID',
    'SUBSCRIPTION_PRICE'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    console.log('   ✅ Todas las variables de entorno están configuradas');
    console.log(`   📦 Plan ID: ${process.env.MERCADOPAGO_PLAN_ID}`);
    console.log(`   💰 Precio: $${process.env.SUBSCRIPTION_PRICE} ARS`);
    return true;
  } else {
    console.log('   ❌ Variables faltantes:', missingVars);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🎯 Ejecutando suite de pruebas...\n');
  
  const results = {
    health: await testHealthCheck(),
    subscription: await testSubscriptionEndpoint(),
    config: await testMercadoPagoConfig()
  };
  
  console.log('\n📊 Resumen de Pruebas:');
  console.log(`   API Health: ${results.health ? '✅' : '❌'}`);
  console.log(`   Subscription Endpoint: ${results.subscription ? '✅' : '❌'}`);
  console.log(`   MercadoPago Config: ${results.config ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 Todas las pruebas pasaron! La API está lista para probar con usuarios reales.');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisar configuración antes de continuar.');
  }
  
  return allPassed;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, makeRequest };
