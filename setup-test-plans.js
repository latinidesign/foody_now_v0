#!/usr/bin/env node

/**
 * Script para configurar planes con MercadoPago IDs de prueba
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTestPlans() {
  console.log('🔧 Configurando planes de prueba con MercadoPago')
  console.log('===============================================\n')

  try {
    // Obtener planes existentes
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('created_at')

    if (plansError) {
      throw new Error(`Error obteniendo planes: ${plansError.message}`)
    }

    console.log(`📋 Encontrados ${plans.length} planes existentes`)

    // Configurar IDs de prueba de MercadoPago
    const testPlanIds = [
      'TEST_PLAN_TRIAL_123',      // Plan trial
      'TEST_PLAN_MONTHLY_456',    // Plan mensual
      'TEST_PLAN_YEARLY_789'      // Plan anual
    ]

    for (let i = 0; i < Math.min(plans.length, testPlanIds.length); i++) {
      const plan = plans[i]
      const testMpId = testPlanIds[i]

      console.log(`\n🔄 Actualizando plan "${plan.display_name}"...`)
      console.log(`   ID: ${plan.id}`)
      console.log(`   Precio: $${plan.price}`)
      console.log(`   Asignando MP ID: ${testMpId}`)

      // Actualizar el plan con el MP ID de prueba
      const { error: updateError } = await supabase
        .from('subscription_plans')
        .update({
          mercadopago_plan_id: testMpId,
          updated_at: new Date().toISOString()
        })
        .eq('id', plan.id)

      if (updateError) {
        console.error(`   ❌ Error: ${updateError.message}`)
      } else {
        console.log('   ✅ Actualizado exitosamente')
      }
    }

    // Verificar la actualización
    console.log('\n📊 Verificando configuración...')
    
    const { data: updatedPlans, error: verifyError } = await supabase
      .from('subscription_plans')
      .select('id, name, display_name, price, mercadopago_plan_id')
      .order('created_at')

    if (verifyError) {
      throw new Error(`Error verificando: ${verifyError.message}`)
    }

    console.log('\n✅ Configuración completada!')
    console.log('\n📋 Estado final de los planes:')
    
    updatedPlans.forEach((plan, index) => {
      const status = plan.mercadopago_plan_id ? '✅' : '⚠️'
      console.log(`   ${status} ${plan.display_name}`)
      console.log(`      ID: ${plan.id}`)
      console.log(`      Precio: $${plan.price}`)
      console.log(`      MP ID: ${plan.mercadopago_plan_id || 'No configurado'}`)
      console.log('')
    })

    console.log('🎉 ¡Planes configurados para pruebas!')
    console.log('\n🔗 Ahora puedes probar en: http://localhost:3000/test-subscriptions')
    
  } catch (error) {
    console.error('❌ Error configurando planes:', error.message)
    process.exit(1)
  }
}

// Ejecutar configuración
setupTestPlans()
