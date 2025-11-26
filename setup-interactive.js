#!/usr/bin/env node

/**
 * Script interactivo para configurar producción paso a paso
 */

const readline = require('readline')
const fs = require('fs')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('🚀 Configurador Interactivo para Producción FoodyNow')
console.log('==================================================\n')

const config = {}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

async function collectConfig() {
  console.log('📝 Vamos a configurar las variables de producción...\n')

  // URLs de producción
  console.log('1️⃣ CONFIGURACIÓN DE URLs')
  config.appUrl = await askQuestion('🌐 URL de tu aplicación (ej: https://foodynow.com.ar): ')
  
  if (!config.appUrl.startsWith('https://')) {
    console.log('⚠️  La URL debe comenzar con https:// para producción')
    config.appUrl = 'https://' + config.appUrl.replace(/^https?:\/\//, '')
  }

  // MercadoPago
  console.log('\n2️⃣ CONFIGURACIÓN DE MERCADOPAGO')
  console.log('📋 Ve a: https://www.mercadopago.com.ar/developers/panel')
  console.log('   1. Selecciona tu aplicación de PRODUCCIÓN')
  console.log('   2. Ve a "Credenciales" → "Credenciales de producción"')
  console.log('')
  
  config.mpAccessToken = await askQuestion('🔑 Access Token de PRODUCCIÓN (APP_USR_...): ')
  config.mpPublicKey = await askQuestion('🔓 Public Key de PRODUCCIÓN (APP_USR_...): ')

  // Supabase
  console.log('\n3️⃣ CONFIGURACIÓN DE BASE DE DATOS')
  console.log('📋 Ve a: https://supabase.com/dashboard/projects')
  console.log('   1. Selecciona tu proyecto de PRODUCCIÓN')
  console.log('   2. Ve a Settings → API')
  console.log('')
  
  config.supabaseUrl = await askQuestion('🗄️  URL de Supabase PRODUCCIÓN (https://...supabase.co): ')
  config.supabaseServiceKey = await askQuestion('🔐 Service Role Key de PRODUCCIÓN: ')
  config.supabaseAnonKey = await askQuestion('🔓 Anon Key de PRODUCCIÓN: ')

  return config
}

function generateEnvFile(config) {
  const envContent = `# Configuración de Producción - FoodyNow
# Generado automáticamente el ${new Date().toLocaleString()}

# ============================================
# MERCADOPAGO - PRODUCCIÓN
# ============================================
MERCADOPAGO_ACCESS_TOKEN=${config.mpAccessToken}
MERCADOPAGO_PUBLIC_KEY=${config.mpPublicKey}

# ============================================
# URLs DE PRODUCCIÓN  
# ============================================
NEXT_PUBLIC_APP_URL=${config.appUrl}
MERCADOPAGO_WEBHOOK_URL=${config.appUrl}/api/subscription/webhook-new

# ============================================
# BASE DE DATOS - PRODUCCIÓN
# ============================================
NEXT_PUBLIC_SUPABASE_URL=${config.supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${config.supabaseServiceKey}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${config.supabaseAnonKey}

# ============================================
# OTRAS CONFIGURACIONES
# ============================================
NODE_ENV=production
NEXT_PUBLIC_ENV=production
`

  return envContent
}

async function main() {
  try {
    const config = await collectConfig()
    
    console.log('\n📄 Generando archivo .env.production...')
    
    const envContent = generateEnvFile(config)
    fs.writeFileSync('.env.production', envContent)
    
    console.log('✅ Archivo .env.production creado!')
    console.log('\n📋 PRÓXIMOS PASOS:')
    console.log('1. Revisa el archivo .env.production')
    console.log('2. Ejecuta: node setup-production-plans.js')
    console.log('3. Ejecuta: node validate-production.js')
    console.log('4. Configura los webhooks en MercadoPago')
    console.log('5. Haz un deploy de tu aplicación')
    
    console.log('\n🔗 Enlaces importantes:')
    console.log(`   App: ${config.appUrl}`)
    console.log('   Panel MP: https://www.mercadopago.com.ar/developers/panel')
    console.log('   Supabase: https://supabase.com/dashboard')
    
    console.log('\n🎯 Configuración de Webhooks en MercadoPago:')
    console.log(`   URL: ${config.appUrl}/api/subscription/webhook-new`)
    console.log('   Eventos: preapproval, payment')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    rl.close()
  }
}

main()
