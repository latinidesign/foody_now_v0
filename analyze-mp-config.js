// Script para analizar la configuración de MercadoPago
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeConfig() {
  console.log('🔍 Analizando configuración de MercadoPago...\n')
  
  // Obtener tienda
  const { data: store } = await supabase
    .from('stores')
    .select('id, name, slug')
    .eq('slug', 'pizzeria-don-mario')
    .single()
  
  if (!store) {
    console.log('❌ No se encontró la tienda pizzeria-don-mario')
    return
  }
  
  console.log(`🏪 Tienda: ${store.name} (${store.slug})`)
  
  // Obtener configuración de pagos
  const { data: settings } = await supabase
    .from('store_settings')
    .select('mercadopago_access_token, mercadopago_public_key')
    .eq('store_id', store.id)
    .single()
  
  if (!settings) {
    console.log('❌ No se encontró configuración de MercadoPago para esta tienda')
    return
  }
  
  const accessToken = settings.mercadopago_access_token
  const publicKey = settings.mercadopago_public_key
  
  console.log('\n💳 ANÁLISIS DE CREDENCIALES MERCADOPAGO:')
  console.log('=========================================')
  
  if (!accessToken || !publicKey) {
    console.log('❌ Faltan credenciales de MercadoPago')
    console.log(`Access Token: ${accessToken ? '✅ Configurado' : '❌ Faltante'}`)
    console.log(`Public Key: ${publicKey ? '✅ Configurado' : '❌ Faltante'}`)
    return
  }
  
  // Analizar tipo de credenciales
  console.log(`Access Token: ${accessToken.substring(0, 20)}...`)
  console.log(`Public Key: ${publicKey.substring(0, 20)}...`)
  
  // Determinar si son credenciales de TEST o PRODUCCIÓN
  let environment = 'UNKNOWN'
  let issue = ''
  
  if (accessToken.startsWith('TEST-')) {
    environment = 'TEST (Desarrollo - API Básica)'
  } else if (accessToken.startsWith('APP_USR-')) {
    // Para Checkout PRO, verificar collector_id de cuentas de prueba conocidas
    const collectorId = accessToken.split('-')[1]
    
    // Collector IDs conocidos de cuentas de prueba Checkout PRO
    const testCollectorIds = ['4543118004929687', '2933430096'] // Agrega aquí los IDs de tus cuentas de prueba
    
    if (testCollectorIds.some(id => accessToken.includes(id))) {
      environment = 'TEST (Checkout PRO - Cuenta de Prueba)'
    } else {
      environment = 'PRODUCCIÓN (Checkout PRO)'
      issue = '⚠️  ADVERTENCIA: Tienes credenciales de PRODUCCIÓN. Verifica que estés usando datos de prueba.'
    }
  }
  
  console.log(`\n🎯 Ambiente detectado: ${environment}`)
  
  if (issue) {
    console.log(`\n❌ ${issue}`)
    console.log('\n🔧 SOLUCIÓN:')
    console.log('1. Ve a https://www.mercadopago.com.ar/developers/panel/app')
    console.log('2. Selecciona tu aplicación')
    console.log('3. Ve a "Credenciales de prueba"')
    console.log('4. Copia las credenciales que empiecen con TEST-')
    console.log('5. Actualiza la configuración de la tienda')
  } else if (environment === 'TEST (Desarrollo)') {
    console.log('\n✅ Configuración correcta para desarrollo')
    console.log('Puedes usar tarjetas de prueba de MercadoPago')
  }
  
  console.log('\n📋 TARJETAS DE PRUEBA VÁLIDAS:')
  console.log('Visa: 4170 0688 1010 8020')
  console.log('Mastercard: 5031 7557 3453 0604') 
  console.log('American Express: 3711 8030 3257 522')
  console.log('CVV: 123 | Vencimiento: cualquier fecha futura')
}

analyzeConfig().catch(console.error)
