#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 DIAGNÓSTICO DEL PROBLEMA DE PEDIDOS\n');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPaymentFlow() {
  try {
    // 1. Verificar configuración básica
    console.log('1️⃣ CONFIGURACIÓN:');
    console.log('   URL Base:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('   Webhook URL:', `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/mercadopago`);
    
    // 2. Últimas checkout sessions sin procesar
    console.log('\n2️⃣ SESIONES SIN PROCESAR:');
    const { data: pendingSessions } = await supabase
      .from('checkout_sessions')
      .select('id, status, payment_status, total, created_at, order_id')
      .eq('status', 'pending')
      .is('order_id', null)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (pendingSessions.length === 0) {
      console.log('   ✅ No hay sesiones pendientes');
    } else {
      pendingSessions.forEach((session, i) => {
        console.log(`   ${i+1}. ${session.id.substring(0,8)}... - $${session.total?.toLocaleString()} - ${new Date(session.created_at).toLocaleString()}`);
      });
    }
    
    // 3. Últimos pagos registrados
    console.log('\n3️⃣ PAGOS REGISTRADOS:');
    const { data: payments } = await supabase
      .from('payments')
      .select('provider_payment_id, status, created_at, order_id')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (payments.length === 0) {
      console.log('   ❌ NO HAY PAGOS REGISTRADOS - Este es el problema');
    } else {
      payments.forEach((payment, i) => {
        console.log(`   ${i+1}. MP ID: ${payment.provider_payment_id} - Estado: ${payment.status}`);
      });
    }
    
    // 4. Verificar configuración de MercadoPago en tiendas
    console.log('\n4️⃣ CONFIGURACIÓN DE TIENDAS:');
    const { data: stores } = await supabase
      .from('stores')
      .select(`
        name, slug, is_active,
        store_settings(mercadopago_access_token)
      `)
      .eq('is_active', true);
    
    stores.forEach(store => {
      const hasMP = store.store_settings?.mercadopago_access_token ? '✅' : '❌';
      console.log(`   ${hasMP} ${store.name} (${store.slug})`);
    });
    
    console.log('\n🎯 DIAGNÓSTICO:');
    if (payments.length === 0) {
      console.log('❌ PROBLEMA: Los webhooks de MercadoPago NO están llegando');
      console.log('📋 POSIBLES CAUSAS:');
      console.log('   1. Webhook no configurado en MercadoPago');
      console.log('   2. URL de webhook incorrecta en MP');
      console.log('   3. Credenciales incorrectas');
      console.log('   4. Error en el endpoint /api/webhook/mercadopago');
    }
    
    console.log('\n🔧 PRÓXIMOS PASOS:');
    console.log('1. Verificar configuración de webhook en MercadoPago');
    console.log('2. Probar el endpoint de webhook manualmente');
    console.log('3. Revisar logs del servidor');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkPaymentFlow();
