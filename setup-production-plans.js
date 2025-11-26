#!/usr/bin/env node

/**
 * Script para crear planes reales en MercadoPago y actualizar la base de datos
 * USAR SOLO EN PRODUCCIÓN CON TOKENS REALES
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
const appUrl = process.env.NEXT_PUBLIC_APP_URL

console.log('🚀 Configurador de Planes Reales para Producción')
console.log('==============================================\n')

// Validar variables de entorno
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de Supabase')
  process.exit(1)
}

if (!mpAccessToken) {
  console.error('❌ Error: Falta MERCADOPAGO_ACCESS_TOKEN')
  console.log('💡 Configura tu token de producción en .env.local')
  process.exit(1)
}

if (!appUrl || appUrl.includes('localhost')) {
  console.error('❌ Error: NEXT_PUBLIC_APP_URL debe ser una URL de producción')
  console.log('💡 Ejemplo: https://foodynow.com.ar')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuración de planes para producción
const PRODUCTION_PLANS = [
  {
    name: 'foody_basic_monthly',
    displayName: 'Plan Básico Mensual',
    description: 'Plan ideal para empezar tu tienda online',
    price: 36000, // $36,000 ARS
    billingFrequency: 'monthly',
    trialDays: 15,
    features: [
      'Tienda online completa',
      'Gestión de pedidos ilimitados', 
      'WhatsApp Business integrado',
      'Estadísticas básicas',
      'Soporte por email',
      'Personalización de marca básica'
    ]
  },
  {
    name: 'foody_yearly_discount', 
    displayName: 'Plan Anual con Descuento',
    description: 'Ahorra 20% pagando anualmente',
    price: 345600, // $345,600 ARS (20% descuento vs mensual)
    billingFrequency: 'yearly',
    trialDays: 15,
    features: [
      'Tienda online completa',
      'Gestión de pedidos ilimitados',
      'WhatsApp Business integrado', 
      'Estadísticas avanzadas',
      'Soporte prioritario',
      'Personalización avanzada',
      'Analytics detallados',
      '20% de descuento vs plan mensual'
    ]
  },
  {
    name: 'foody_premium_monthly',
    displayName: 'Plan Premium Mensual', 
    description: 'Plan completo para tiendas establecidas',
    price: 58000, // $58,000 ARS
    billingFrequency: 'monthly',
    trialDays: 15,
    features: [
      'Todo del Plan Básico',
      'Múltiples ubicaciones',
      'Integración con redes sociales',
      'Campañas de marketing automatizadas',
      'Soporte telefónico 24/7',
      'Reportes avanzados',
      'API personalizada'
    ]
  }
]

async function createMercadoPagoPlan(planData) {
  console.log(`🔄 Creando plan "${planData.displayName}" en MercadoPago...`)
  
  const mpPlanData = {
    reason: planData.displayName,
    back_url: `${appUrl}/subscription/success`,
    auto_recurring: {
      frequency: planData.billingFrequency === 'monthly' ? 1 : 12,
      frequency_type: 'months',
      repetitions: planData.billingFrequency === 'monthly' ? 12 : 1,
      billing_day: 1,
      billing_day_proportional: true,
      free_trial: {
        frequency: planData.trialDays,
        frequency_type: 'days'
      },
      transaction_amount: planData.price,
      currency_id: 'ARS'
    },
    payment_methods_allowed: {
      payment_types: [
        { id: 'credit_card' },
        { id: 'debit_card' }
      ],
      payment_methods: [
        { id: 'visa' },
        { id: 'master' },
        { id: 'amex' },
        { id: 'naranja' },
        { id: 'cabal' }
      ]
    }
  }

  try {
    const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mpPlanData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Error de MercadoPago: ${result.message || response.statusText}`)
    }

    console.log(`   ✅ Plan creado con ID: ${result.id}`)
    return result.id

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    throw error
  }
}

async function updateDatabasePlan(planData, mercadoPagoId) {
  console.log(`💾 Actualizando plan en base de datos...`)

  try {
    // Buscar si ya existe un plan con este nombre
    const { data: existingPlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', planData.name)
      .single()

    if (existingPlan) {
      // Actualizar plan existente
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          display_name: planData.displayName,
          description: planData.description,
          price: planData.price,
          billing_frequency: planData.billingFrequency,
          trial_period_days: planData.trialDays,
          features: planData.features,
          mercadopago_plan_id: mercadoPagoId,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPlan.id)

      if (error) throw error
      console.log(`   ✅ Plan actualizado en DB`)
      return existingPlan.id

    } else {
      // Crear nuevo plan
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          name: planData.name,
          display_name: planData.displayName,
          description: planData.description,
          price: planData.price,
          billing_frequency: planData.billingFrequency,
          frequency: planData.billingFrequency, // Campo frequency requerido
          trial_period_days: planData.trialDays,
          is_trial: planData.trialDays > 0,
          features: planData.features,
          mercadopago_plan_id: mercadoPagoId,
          is_active: true,
          currency: 'ARS'
        })
        .select('id')
        .single()

      if (error) throw error
      console.log(`   ✅ Plan creado en DB con ID: ${data.id}`)
      return data.id
    }

  } catch (error) {
    console.error(`   ❌ Error en DB: ${error.message}`)
    throw error
  }
}

async function setupProductionPlans() {
  console.log('📋 Configurando planes de producción...\n')

  const results = []

  for (const planData of PRODUCTION_PLANS) {
    console.log(`\n🔧 Procesando: ${planData.displayName}`)
    console.log(`   💰 Precio: $${planData.price.toLocaleString('es-AR')} ARS`)
    console.log(`   📅 Frecuencia: ${planData.billingFrequency}`)
    console.log(`   🎁 Trial: ${planData.trialDays} días`)

    try {
      // Crear plan en MercadoPago
      const mercadoPagoId = await createMercadoPagoPlan(planData)
      
      // Actualizar/crear en base de datos
      const dbId = await updateDatabasePlan(planData, mercadoPagoId)

      results.push({
        name: planData.displayName,
        dbId,
        mercadoPagoId,
        status: 'success'
      })

      console.log(`   🎉 ¡Plan configurado exitosamente!`)

    } catch (error) {
      console.error(`   💥 Error configurando plan: ${error.message}`)
      results.push({
        name: planData.displayName,
        status: 'error',
        error: error.message
      })
    }
  }

  // Resumen final
  console.log('\n' + '='.repeat(50))
  console.log('📊 RESUMEN DE CONFIGURACIÓN')
  console.log('='.repeat(50))

  const successful = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status === 'error')

  console.log(`✅ Planes configurados exitosamente: ${successful.length}`)
  console.log(`❌ Planes con errores: ${failed.length}`)

  if (successful.length > 0) {
    console.log('\n✅ PLANES ACTIVOS:')
    successful.forEach(plan => {
      console.log(`   📋 ${plan.name}`)
      console.log(`      DB ID: ${plan.dbId}`)  
      console.log(`      MP ID: ${plan.mercadoPagoId}`)
    })
  }

  if (failed.length > 0) {
    console.log('\n❌ PLANES CON ERRORES:')
    failed.forEach(plan => {
      console.log(`   📋 ${plan.name}: ${plan.error}`)
    })
  }

  if (successful.length === PRODUCTION_PLANS.length) {
    console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!')
    console.log('🔗 Ahora puedes probar en: ' + appUrl)
    console.log('📚 Revisa la documentación en: docs/production-setup.md')
  } else {
    console.log('\n⚠️  Configuración parcial completada. Revisa los errores arriba.')
  }
}

// Ejecutar configuración
setupProductionPlans().catch(error => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})
