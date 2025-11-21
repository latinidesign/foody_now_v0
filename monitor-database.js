#!/usr/bin/env node

/**
 * Monitor de base de datos para pruebas de suscripción
 * Muestra el estado actual de usuarios y suscripciones
 */

require('dotenv').config({ path: '.env.local' });

// Simulamos el cliente usando fetch directo
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkUsers() {
  console.log('👥 Usuarios registrados:');
  console.log('   📝 (Verificar manualmente en Supabase Dashboard)');
}

async function checkSubscriptions() {
  console.log('\n💳 Suscripciones:');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?select=*&order=created_at.desc`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log('   ❌ Error obteniendo suscripciones:', response.status);
      return;
    }
    
    const subscriptions = await response.json();
    
    if (subscriptions.length === 0) {
      console.log('   📝 No hay suscripciones');
      return;
    }
    
    subscriptions.forEach((sub, index) => {
      console.log(`   ${index + 1}. Usuario: ${sub.user_id}`);
      console.log(`      📊 Status: ${sub.status}`);
      console.log(`      💰 Precio: $${sub.price} ${sub.currency}`);
      console.log(`      🎯 Plan: ${sub.plan_id}`);
      if (sub.trial_start_date) {
        console.log(`      🆓 Trial: ${new Date(sub.trial_start_date).toLocaleDateString()} - ${new Date(sub.trial_end_date).toLocaleDateString()}`);
      }
      if (sub.mercadopago_preapproval_id) {
        console.log(`      🏷️  MP ID: ${sub.mercadopago_preapproval_id}`);
      }
      console.log(`      📅 Creado: ${new Date(sub.created_at).toLocaleString()}`);
      console.log('');
    });
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

async function checkStores() {
  console.log('🏪 Tiendas creadas:');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/stores?select=id,owner_id,name,slug,is_active,created_at&order=created_at.desc`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log('   ❌ Error obteniendo tiendas:', response.status);
      return;
    }
    
    const stores = await response.json();
    
    if (stores.length === 0) {
      console.log('   📝 No hay tiendas creadas');
      return;
    }
    
    stores.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name} (${store.slug})`);
      console.log(`      👤 Owner: ${store.owner_id}`);
      console.log(`      🌐 URL: http://localhost:3000/store/${store.slug}`);
      console.log(`      📊 Activa: ${store.is_active ? 'Sí' : 'No'}`);
      console.log(`      📅 Creada: ${new Date(store.created_at).toLocaleString()}`);
      console.log('');
    });
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

async function monitorDatabase() {
  console.log('📊 Estado actual de la base de datos');
  console.log('=====================================\n');
  
  await checkUsers();
  await checkSubscriptions();
  await checkStores();
  
  console.log('=====================================');
  console.log(`🕐 Actualizado: ${new Date().toLocaleString()}`);
}

// Modo watch si se pasa argumento --watch
if (process.argv.includes('--watch')) {
  console.log('👀 Modo monitor activado (Ctrl+C para salir)\n');
  
  monitorDatabase();
  setInterval(monitorDatabase, 5000); // Cada 5 segundos
} else {
  monitorDatabase().catch(console.error);
}
