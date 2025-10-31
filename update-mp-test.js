// Script para actualizar credenciales de MercadoPago a modo TEST
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function updateToTestCredentials() {
  console.log('🔄 Actualizando credenciales a modo TEST...\n')
  
  // CREDENCIALES DE PRUEBA REALES DE CHECKOUT PRO
  const TEST_ACCESS_TOKEN = 'APP_USR-4543118004929687-102909-8b4281c83e08e131f0c4c4c51305fe0f-2933430096'
  const TEST_PUBLIC_KEY = 'APP_USR-67473974-b1df-4579-8f57-6f5879f2acfa'
  
  if (TEST_ACCESS_TOKEN === 'TEST-TU-ACCESS-TOKEN-AQUI') {
    console.log('❌ DEBES REEMPLAZAR LAS CREDENCIALES EN EL SCRIPT')
    console.log('1. Ve a https://www.mercadopago.com.ar/developers/panel/app')
    console.log('2. Copia tus credenciales de PRUEBA')
    console.log('3. Reemplaza TEST_ACCESS_TOKEN y TEST_PUBLIC_KEY en este script')
    console.log('4. Ejecuta el script nuevamente')
    return
  }
  
  // Obtener tienda
  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('slug', 'pizzeria-don-mario')
    .single()
  
  if (!store) {
    console.log('❌ No se encontró la tienda')
    return
  }
  
  // Actualizar credenciales
  const { error } = await supabase
    .from('store_settings')
    .update({
      mercadopago_access_token: TEST_ACCESS_TOKEN,
      mercadopago_public_key: TEST_PUBLIC_KEY
    })
    .eq('store_id', store.id)
  
  if (error) {
    console.log('❌ Error actualizando credenciales:', error)
    return
  }
  
  console.log('✅ Credenciales actualizadas a modo TEST')
  console.log(`🏪 Tienda: ${store.name}`)
  console.log('\n🎯 Ahora puedes usar tarjetas de prueba:')
  console.log('Visa: 4170 0688 1010 8020')
  console.log('Mastercard: 5031 7557 3453 0604')
  console.log('CVV: 123 | Vencimiento: cualquier fecha futura')
}

updateToTestCredentials().catch(console.error)
