#!/usr/bin/env node

/**
 * Script para mostrar todas las configuraciones de suscripción de MercadoPago
 * 
 * Muestra:
 * - Planes configurados en el código
 * - Variables de entorno
 * - Planes en la base de datos
 * - Suscripciones activas
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Configuración de planes (desde el código)
const MERCADOPAGO_PLANS = {
  WITH_TRIAL: {
    id: process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID || '',
    name: 'Suscripción Mensual con Trial',
    description: '14 días de prueba gratuita + Renovación mensual',
    trial_days: 14,
    price: 36000,
    currency: 'ARS',
    frequency: 1,
    frequency_type: 'months',
  },
  
  WITHOUT_TRIAL: {
    id: '946bf6e3186741b5b7b8accbbdf646a5',
    name: 'Suscripción Mensual (Renovación)',
    description: 'Renovación mensual sin período de prueba',
    trial_days: 0,
    price: 36000,
    currency: 'ARS',
    frequency: 1,
    frequency_type: 'months',
  }
}

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 CONFIGURACIÓN DE SUSCRIPCIONES DE MERCADOPAGO - FOODYNOW')
  console.log('='.repeat(80) + '\n')

  // 1. VARIABLES DE ENTORNO
  console.log('1️⃣  VARIABLES DE ENTORNO')
  console.log('-'.repeat(80))
  console.log('NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID:', 
    process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID || '❌ NO CONFIGURADA')
  console.log('MERCADOPAGO_ACCESS_TOKEN:', 
    process.env.MERCADOPAGO_ACCESS_TOKEN ? '✅ Configurado (oculto)' : '❌ NO CONFIGURADO')
  console.log('NEXT_PUBLIC_APP_URL:', 
    process.env.NEXT_PUBLIC_APP_URL || '❌ NO CONFIGURADA')
  console.log()

  // 2. PLANES EN EL CÓDIGO
  console.log('2️⃣  PLANES CONFIGURADOS EN EL CÓDIGO')
  console.log('-'.repeat(80))
  console.log('\n🔹 Plan CON TRIAL:')
  console.log('   ID MercadoPago:', MERCADOPAGO_PLANS.WITH_TRIAL.id || '❌ NO CONFIGURADO')
  console.log('   Nombre:', MERCADOPAGO_PLANS.WITH_TRIAL.name)
  console.log('   Días de trial:', MERCADOPAGO_PLANS.WITH_TRIAL.trial_days)
  console.log('   Precio:', `$${MERCADOPAGO_PLANS.WITH_TRIAL.price} ${MERCADOPAGO_PLANS.WITH_TRIAL.currency}`)
  console.log('   Frecuencia:', `${MERCADOPAGO_PLANS.WITH_TRIAL.frequency} ${MERCADOPAGO_PLANS.WITH_TRIAL.frequency_type}`)
  
  console.log('\n🔹 Plan SIN TRIAL:')
  console.log('   ID MercadoPago:', MERCADOPAGO_PLANS.WITHOUT_TRIAL.id)
  console.log('   Nombre:', MERCADOPAGO_PLANS.WITHOUT_TRIAL.name)
  console.log('   Días de trial:', MERCADOPAGO_PLANS.WITHOUT_TRIAL.trial_days)
  console.log('   Precio:', `$${MERCADOPAGO_PLANS.WITHOUT_TRIAL.price} ${MERCADOPAGO_PLANS.WITHOUT_TRIAL.currency}`)
  console.log('   Frecuencia:', `${MERCADOPAGO_PLANS.WITHOUT_TRIAL.frequency} ${MERCADOPAGO_PLANS.WITHOUT_TRIAL.frequency_type}`)
  console.log()

  // 3. PLANES EN LA BASE DE DATOS
  console.log('3️⃣  PLANES EN LA BASE DE DATOS')
  console.log('-'.repeat(80))
  const { data: plans, error: plansError } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('created_at', { ascending: false })

  if (plansError) {
    console.error('❌ Error consultando planes:', plansError.message)
  } else if (!plans || plans.length === 0) {
    console.log('⚠️  No hay planes configurados en la base de datos')
  } else {
    plans.forEach((plan, index) => {
      console.log(`\n📦 Plan ${index + 1}:`)
      console.log('   ID:', plan.id)
      console.log('   Nombre interno:', plan.name)
      console.log('   Nombre display:', plan.display_name)
      console.log('   Precio:', `$${plan.price}`)
      console.log('   Frecuencia:', plan.billing_frequency || plan.frequency || 'N/A')
      console.log('   Días de trial:', plan.trial_period_days || 0)
      console.log('   ID MercadoPago:', plan.mercadopago_plan_id || '❌ NO CONFIGURADO')
      console.log('   Activo:', plan.is_active ? '✅ Sí' : '❌ No')
      console.log('   Creado:', new Date(plan.created_at).toLocaleString('es-AR'))
    })
  }
  console.log()

  // 4. SUSCRIPCIONES ACTIVAS
  console.log('4️⃣  SUSCRIPCIONES ACTIVAS')
  console.log('-'.repeat(80))
  const { data: subscriptions, error: subsError } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(name, display_name, price),
      store:stores(name, slug)
    `)
    .in('status', ['trial', 'active'])
    .order('created_at', { ascending: false })

  if (subsError) {
    console.error('❌ Error consultando suscripciones:', subsError.message)
  } else if (!subscriptions || subscriptions.length === 0) {
    console.log('⚠️  No hay suscripciones activas en este momento')
  } else {
    console.log(`\n✅ ${subscriptions.length} suscripción(es) activa(s):\n`)
    subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. Tienda: ${sub.store?.name || 'Sin nombre'}`)
      console.log(`   Estado: ${sub.status}`)
      console.log(`   Plan: ${sub.plan?.display_name || 'N/A'}`)
      console.log(`   Precio: $${sub.plan?.price || 0}`)
      console.log(`   ID Preapproval MP: ${sub.mercadopago_preapproval_id || 'N/A'}`)
      if (sub.trial_ends_at) {
        const trialEnds = new Date(sub.trial_ends_at)
        const now = new Date()
        const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24))
        console.log(`   Trial termina: ${trialEnds.toLocaleString('es-AR')} (${daysLeft} días)`)
      }
      console.log(`   Renovación automática: ${sub.auto_renewal ? '✅ Sí' : '❌ No'}`)
      console.log(`   Creada: ${new Date(sub.created_at).toLocaleString('es-AR')}`)
      console.log()
    })
  }

  // 5. ESTADÍSTICAS
  console.log('5️⃣  ESTADÍSTICAS GENERALES')
  console.log('-'.repeat(80))
  const { data: allSubs } = await supabase
    .from('subscriptions')
    .select('status')

  if (allSubs) {
    const stats = {
      trial: 0,
      active: 0,
      pending: 0,
      cancelled: 0,
      expired: 0,
      suspended: 0,
      past_due: 0
    }

    allSubs.forEach(sub => {
      if (stats.hasOwnProperty(sub.status)) {
        stats[sub.status]++
      }
    })

    console.log('Estado de suscripciones:')
    console.log('   🔹 Trial:', stats.trial)
    console.log('   ✅ Activas:', stats.active)
    console.log('   ⏳ Pendientes:', stats.pending)
    console.log('   ❌ Canceladas:', stats.cancelled)
    console.log('   ⏰ Expiradas:', stats.expired)
    console.log('   ⏸️  Suspendidas:', stats.suspended)
    console.log('   ⚠️  Vencidas:', stats.past_due)
    console.log('   📊 TOTAL:', allSubs.length)
  }
  console.log()

  // 6. TIENDAS Y SU ESTADO
  console.log('6️⃣  TIENDAS Y ESTADO DE TRIAL')
  console.log('-'.repeat(80))
  const { data: stores } = await supabase
    .from('stores')
    .select(`
      id,
      name,
      slug,
      trial_used,
      subscriptions(status, trial_ends_at)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (stores && stores.length > 0) {
    console.log(`\nMostrando últimas ${stores.length} tiendas:\n`)
    stores.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name || 'Sin nombre'} (${store.slug})`)
      console.log(`   Trial usado: ${store.trial_used ? '✅ Sí' : '❌ No'}`)
      console.log(`   Suscripciones: ${store.subscriptions?.length || 0}`)
      console.log()
    })
  }

  console.log('='.repeat(80))
  console.log('✅ Reporte completado')
  console.log('='.repeat(80) + '\n')
}

main().catch(console.error)
