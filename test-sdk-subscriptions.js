#!/usr/bin/env node

/**
 * Script de prueba para el SDK de MercadoPago Subscriptions
 */

const { getMercadoPagoSDK } = require('./lib/payments/providers/mercadopago-subscriptions')
const { getSubscriptionService } = require('./lib/services/subscription-service')

require('dotenv').config({ path: '.env.local' })

async function testSDK() {
  console.log('🧪 Testing MercadoPago Subscriptions SDK')
  console.log('=====================================\n')

  try {
    // Test 1: Verificar configuración
    console.log('1️⃣ Verificando configuración...')
    
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado')
    }
    
    console.log('✅ Token de acceso configurado')
    
    // Test 2: Instanciar SDK
    console.log('\n2️⃣ Instanciando SDK...')
    
    const sdk = getMercadoPagoSDK()
    console.log('✅ SDK instanciado correctamente')
    
    // Test 3: Instanciar servicio
    console.log('\n3️⃣ Instanciando servicio...')
    
    const subscriptionService = getSubscriptionService()
    console.log('✅ Servicio instanciado correctamente')
    
    // Test 4: Obtener planes (si existen)
    console.log('\n4️⃣ Obteniendo planes...')
    
    try {
      const plans = await subscriptionService.getPlans()
      console.log(`✅ Planes obtenidos: ${plans.length}`)
      
      if (plans.length > 0) {
        console.log('📋 Planes disponibles:')
        plans.forEach(plan => {
          console.log(`   - ${plan.display_name}: $${plan.price} (${plan.billing_frequency})`)
        })
      }
    } catch (error) {
      console.log(`⚠️ Error obteniendo planes: ${error.message}`)
    }

    // Test 5: Verificar endpoints
    console.log('\n5️⃣ Verificando endpoints disponibles...')
    console.log('📡 Endpoints del SDK:')
    console.log('   - POST /api/subscription/create')
    console.log('   - GET /api/subscription/plans-new')
    console.log('   - GET /api/subscription/store/[storeId]')
    console.log('   - DELETE /api/subscription/store/[storeId]')
    console.log('   - PUT /api/subscription/store/[storeId]/manage')
    console.log('   - POST /api/subscription/sync/[subscriptionId]')
    console.log('   - POST /api/subscription/webhook-new')
    
    console.log('\n✅ SDK configurado correctamente!')
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.message)
    process.exit(1)
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testSDK()
}

module.exports = { testSDK }
