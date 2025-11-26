#!/usr/bin/env node

/**
 * Script para actualizar los planes con IDs reales de MercadoPago
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Actualizando planes con IDs reales de MercadoPago')
console.log('===================================================\n')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Tu plan real de MercadoPago
const REAL_PLAN_ID = '278a634c5ecd4f63951595427df9afd8'

async function updatePlansWithRealIds() {
  try {
    // Obtener planes actuales
    const { data: plans, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('created_at')

    if (fetchError) {
      throw fetchError
    }

    console.log('📋 Planes actuales en DB:')
    plans.forEach(plan => {
      console.log(`  - ${plan.display_name} (${plan.mercadopago_plan_id})`)
    })
    console.log()

    // Actualizar el plan principal (Plan Mensual) con el ID real
    const monthlyPlan = plans.find(p => p.name === 'basic_monthly')
    
    if (monthlyPlan) {
      console.log('🔄 Actualizando Plan Mensual con ID real...')
      
      const { error: updateError } = await supabase
        .from('subscription_plans')
        .update({
          mercadopago_plan_id: REAL_PLAN_ID,
          price: 1000, // Actualizar precio al real
          updated_at: new Date().toISOString()
        })
        .eq('id', monthlyPlan.id)

      if (updateError) {
        throw updateError
      }

      console.log('   ✅ Plan Mensual actualizado con ID real')
      console.log(`   🆔 Nuevo MercadoPago ID: ${REAL_PLAN_ID}`)
      console.log(`   💰 Precio actualizado: $1000 ARS`)
    }

    // Desactivar planes de prueba/trial para evitar confusión
    console.log('\n🔄 Desactivando planes de prueba...')
    
    const { error: deactivateError } = await supabase
      .from('subscription_plans')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .in('name', ['trial', 'basic_yearly'])

    if (deactivateError) {
      console.error('⚠️ Error desactivando planes de prueba:', deactivateError)
    } else {
      console.log('   ✅ Planes de prueba desactivados')
    }

    // Verificar resultado final
    console.log('\n📊 ESTADO FINAL:')
    console.log('================')
    
    const { data: updatedPlans } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('created_at')

    updatedPlans.forEach(plan => {
      console.log(`✅ ${plan.display_name}`)
      console.log(`   💰 Precio: $${plan.price} ARS`)
      console.log(`   🆔 MP ID: ${plan.mercadopago_plan_id}`)
      console.log(`   📅 Frecuencia: ${plan.billing_frequency}`)
      console.log()
    })

    console.log('🎉 ¡Configuración completada!')
    console.log('💡 Ahora puedes crear suscripciones reales en /admin/setup')

  } catch (error) {
    console.error('💥 Error:', error.message)
    process.exit(1)
  }
}

updatePlansWithRealIds()
