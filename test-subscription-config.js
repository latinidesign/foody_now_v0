#!/usr/bin/env node

/**
 * Script de prueba para verificar la configuración de suscripciones
 * Uso: node test-subscription-config.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verificando configuración de suscripciones...\n');

// Verificar variables de entorno
const requiredVars = [
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADOPAGO_PUBLIC_KEY', 
  'MERCADOPAGO_PLAN_ID',
  'SUBSCRIPTION_PRICE'
];

console.log('📋 Variables de entorno:');
let allVarsPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? 
    (varName.includes('TOKEN') || varName.includes('KEY') ? 
      `${value.substring(0, 10)}...` : value) : 
    'NO CONFIGURADA';
  
  console.log(`${status} ${varName}: ${displayValue}`);
  
  if (!value) allVarsPresent = false;
});

console.log('\n🎯 Configuración del plan:');
console.log(`📦 Plan ID: ${process.env.MERCADOPAGO_PLAN_ID || 'NO CONFIGURADO'}`);
console.log(`💰 Precio: $${process.env.SUBSCRIPTION_PRICE || 'NO CONFIGURADO'} ARS`);
console.log(`🏷️  Título: ${process.env.SUBSCRIPTION_TITLE || 'Plan Premium FoodyNow'}`);

console.log('\n🌐 URLs:');
console.log(`🏠 App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`);
console.log(`🔔 Webhook: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`);
console.log(`↩️  Back URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/settings`);

console.log('\n🔒 Entorno:');
const isTest = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-');
console.log(`📍 Modo: ${isTest ? 'PRUEBA (TEST)' : 'PRODUCCIÓN'}`);

if (allVarsPresent) {
  console.log('\n✅ Configuración completa - La API debería funcionar correctamente');
} else {
  console.log('\n❌ Configuración incompleta - Revisar variables faltantes');
}

console.log('\n📄 URL del plan en MercadoPago:');
if (process.env.MERCADOPAGO_PLAN_ID) {
  console.log(`🔗 https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${process.env.MERCADOPAGO_PLAN_ID}`);
} else {
  console.log('❌ Plan ID no configurado');
}
