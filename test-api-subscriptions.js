#!/usr/bin/env node

/**
 * Script de prueba para crear un plan en MercadoPago
 */

async function testCreatePlan() {
  console.log('🧪 Probando creación de plan en MercadoPago')
  console.log('===========================================\n')

  try {
    // Datos del plan de prueba
    const planData = {
      name: 'test_plan_basic',
      display_name: 'Plan Test Básico',
      price: 1000, // $1000 ARS para pruebas
      billing_frequency: 'monthly',
      trial_period_days: 7,
      features: [
        'Tienda online',
        'Gestión de pedidos',
        'WhatsApp integrado',
        'Soporte básico'
      ]
    }

    console.log('📋 Datos del plan:', planData)
    console.log('\n🔄 Creando plan...')

    const response = await fetch('http://localhost:3000/api/subscription/plans-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planData)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', result.error)
      if (result.details) {
        console.error('   Detalles:', result.details)
      }
      return
    }

    console.log('✅ Plan creado exitosamente!')
    console.log('📊 Resultado:', {
      id: result.plan.id,
      name: result.plan.name,
      display_name: result.plan.display_name,
      price: result.plan.price,
      mercadopago_plan_id: result.plan.mercadopago_plan_id
    })

  } catch (error) {
    console.error('❌ Error de conexión:', error.message)
  }
}

async function testCreateSubscription() {
  console.log('\n\n🧪 Probando creación de suscripción')
  console.log('==================================\n')

  try {
    // Datos de suscripción de prueba
    const subscriptionData = {
      storeId: 'test-store-123', // ID de prueba
      planId: '3a237899-a9e2-40af-adc3-bd56f9f5500f', // Plan mensual existente
      payerEmail: 'test@foodnow.com'
    }

    console.log('📋 Datos de suscripción:', subscriptionData)
    console.log('\n🔄 Creando suscripción...')

    const response = await fetch('http://localhost:3000/api/subscription/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', result.error)
      if (result.details) {
        console.error('   Detalles:', result.details)
      }
      return
    }

    console.log('✅ Suscripción creada exitosamente!')
    console.log('📊 Resultado:', {
      subscription_id: result.subscription.id,
      init_point: result.init_point ? 'Disponible' : 'No disponible',
      preapproval_id: result.preapproval_id
    })

    if (result.init_point) {
      console.log('\n🔗 Link de pago:')
      console.log(result.init_point)
    }

  } catch (error) {
    console.error('❌ Error de conexión:', error.message)
  }
}

async function testGetSubscription() {
  console.log('\n\n🧪 Probando consulta de suscripción')
  console.log('===================================\n')

  try {
    const storeId = 'test-store-123'
    
    console.log(`🔍 Consultando suscripción para tienda: ${storeId}`)

    const response = await fetch(`http://localhost:3000/api/subscription/store/${storeId}`)
    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', result.error)
      return
    }

    console.log('✅ Consulta exitosa!')
    console.log('📊 Estado:', {
      has_subscription: !!result.subscription,
      active: result.active,
      trial: result.trial
    })

    if (result.subscription) {
      console.log('📋 Suscripción:', {
        id: result.subscription.id,
        status: result.subscription.status,
        plan: result.subscription.plan?.display_name
      })
    }

  } catch (error) {
    console.error('❌ Error de conexión:', error.message)
  }
}

// Ejecutar tests
async function runTests() {
  await testCreatePlan()
  await testCreateSubscription() 
  await testGetSubscription()
}

runTests()
