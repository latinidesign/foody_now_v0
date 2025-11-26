#!/usr/bin/env node

/**
 * Script para validar que los planes estén correctamente configurados
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
const appUrl = process.env.NEXT_PUBLIC_APP_URL

console.log('🔍 Validador de Configuración de Producción')
console.log('========================================\n')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function validateEnvironment() {
  console.log('1️⃣ Validando variables de entorno...')
  
  const checks = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: supabaseUrl, required: true },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: supabaseServiceKey, required: true },
    { name: 'MERCADOPAGO_ACCESS_TOKEN', value: mpAccessToken, required: true },
    { name: 'NEXT_PUBLIC_APP_URL', value: appUrl, required: true }
  ]

  let allValid = true

  checks.forEach(check => {
    const status = check.value ? '✅' : '❌'
    const isProduction = check.name === 'NEXT_PUBLIC_APP_URL' ? 
      (check.value && !check.value.includes('localhost') ? '🌐 PROD' : '🏠 DEV') : ''
    
    console.log(`   ${status} ${check.name}: ${check.value ? 'Configurado' : 'FALTANTE'} ${isProduction}`)
    
    if (check.required && !check.value) {
      allValid = false
    }
  })

  if (mpAccessToken && mpAccessToken.startsWith('TEST_')) {
    console.log('   ⚠️  ADVERTENCIA: Usando token de PRUEBA')
  } else if (mpAccessToken && mpAccessToken.startsWith('APP_USR_')) {
    console.log('   🎯 Token de PRODUCCIÓN detectado')
  }

  return allValid
}

async function validateDatabase() {
  console.log('\n2️⃣ Validando conexión a base de datos...')
  
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('id, name, display_name, price, mercadopago_plan_id, is_active')
      .eq('is_active', true)

    if (error) {
      console.log('   ❌ Error conectando a Supabase:', error.message)
      return false
    }

    console.log(`   ✅ Conexión exitosa - ${data.length} planes encontrados`)
    return { success: true, plans: data }

  } catch (error) {
    console.log('   ❌ Error de conexión:', error.message)
    return false
  }
}

async function validateMercadoPagoPlans(plans) {
  console.log('\n3️⃣ Validando planes en MercadoPago...')

  if (!mpAccessToken) {
    console.log('   ⚠️  Sin token de MercadoPago - saltando validación')
    return
  }

  for (const plan of plans) {
    console.log(`\n   🔍 Validando: ${plan.display_name}`)
    console.log(`      DB ID: ${plan.id}`)
    console.log(`      MP ID: ${plan.mercadopago_plan_id || 'No configurado'}`)
    console.log(`      Precio: $${plan.price?.toLocaleString('es-AR')} ARS`)

    if (!plan.mercadopago_plan_id || plan.mercadopago_plan_id.startsWith('TEST_')) {
      console.log('      ⚠️  Sin ID de MercadoPago real configurado')
      continue
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/preapproval_plan/${plan.mercadopago_plan_id}`, {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`
        }
      })

      if (response.ok) {
        const mpPlan = await response.json()
        console.log('      ✅ Plan existe en MercadoPago')
        console.log(`         Estado: ${mpPlan.status || 'N/A'}`)
        console.log(`         Precio MP: $${mpPlan.auto_recurring?.transaction_amount || 'N/A'}`)
      } else {
        console.log('      ❌ Plan no encontrado en MercadoPago')
      }
    } catch (error) {
      console.log('      ❌ Error validando plan:', error.message)
    }
  }
}

async function validateEndpoints() {
  console.log('\n4️⃣ Validando endpoints de la API...')

  const endpoints = [
    { path: '/api/subscription/plans-new', method: 'GET' },
    { path: '/api/subscription/webhook-new', method: 'POST' }
  ]

  const baseUrl = appUrl || 'http://localhost:3000'

  for (const endpoint of endpoints) {
    try {
      console.log(`   🔍 Probando ${endpoint.method} ${endpoint.path}`)
      
      const url = `${baseUrl}${endpoint.path}`
      const response = await fetch(url, { 
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: endpoint.method === 'POST' ? JSON.stringify({ test: true }) : undefined
      })

      const status = response.status
      console.log(`      ${status < 400 ? '✅' : '⚠️'} Status: ${status}`)

    } catch (error) {
      console.log(`      ❌ Error: ${error.message}`)
    }
  }
}

async function generateProductionChecklist(plans) {
  console.log('\n📋 CHECKLIST DE PRODUCCIÓN')
  console.log('========================')

  const checks = [
    {
      item: 'Variables de entorno configuradas',
      check: supabaseUrl && supabaseServiceKey && mpAccessToken && appUrl,
    },
    {
      item: 'URL de producción configurada', 
      check: appUrl && !appUrl.includes('localhost')
    },
    {
      item: 'Token de MercadoPago de producción',
      check: mpAccessToken && mpAccessToken.startsWith('APP_USR_')
    },
    {
      item: 'Base de datos accesible',
      check: plans && plans.length > 0
    },
    {
      item: 'Planes con IDs de MercadoPago reales',
      check: plans && plans.some(p => p.mercadopago_plan_id && !p.mercadopago_plan_id.startsWith('TEST_'))
    },
    {
      item: 'SSL/HTTPS configurado',
      check: appUrl && appUrl.startsWith('https://')
    }
  ]

  checks.forEach((check, index) => {
    const status = check.check ? '✅' : '❌'
    console.log(`${status} ${index + 1}. ${check.item}`)
  })

  const readyCount = checks.filter(c => c.check).length
  const totalCount = checks.length

  console.log(`\n📊 Progreso: ${readyCount}/${totalCount} (${Math.round(readyCount/totalCount*100)}%)`)

  if (readyCount === totalCount) {
    console.log('\n🚀 ¡LISTO PARA PRODUCCIÓN!')
  } else {
    console.log('\n⚠️  Completa los elementos faltantes antes de ir a producción')
  }
}

async function runValidation() {
  const envValid = await validateEnvironment()
  
  if (!envValid) {
    console.log('\n❌ Configuración de entorno incompleta')
    return
  }

  const dbResult = await validateDatabase()
  
  if (!dbResult.success) {
    console.log('\n❌ Error de base de datos')
    return
  }

  await validateMercadoPagoPlans(dbResult.plans)
  await validateEndpoints()
  await generateProductionChecklist(dbResult.plans)

  console.log('\n🔗 Enlaces útiles:')
  console.log(`   App: ${appUrl || 'No configurado'}`)
  console.log('   Panel MP: https://www.mercadopago.com.ar/developers/panel')
  console.log('   Docs: ./docs/production-setup.md')
}

// Ejecutar validación
runValidation().catch(console.error)
