#!/usr/bin/env node

/**
 * Script para obtener los planes reales de MercadoPago
 */

require('dotenv').config({ path: '.env.local' })

async function getMercadoPagoPlans() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  
  if (!accessToken) {
    console.error('❌ Error: Falta MERCADOPAGO_ACCESS_TOKEN en .env.local')
    console.log('💡 Configura tu token de MercadoPago para obtener los planes')
    return
  }

  console.log('🔍 Obteniendo planes de MercadoPago...\n')

  try {
    const response = await fetch('https://api.mercadopago.com/preapproval_plan/search', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Error de MercadoPago:', errorData)
      return
    }

    const data = await response.json()
    
    if (!data.results || data.results.length === 0) {
      console.log('📋 No se encontraron planes en MercadoPago')
      console.log('💡 Crea planes en: https://www.mercadopago.com.ar/developers/panel')
      return
    }

    console.log('📋 PLANES ENCONTRADOS EN MERCADOPAGO:')
    console.log('=====================================\n')

    data.results.forEach((plan, index) => {
      console.log(`${index + 1}. Plan: ${plan.reason || plan.id}`)
      console.log(`   🆔 ID: ${plan.id}`)
      console.log(`   💰 Precio: $${plan.auto_recurring?.transaction_amount || 'N/A'} ${plan.auto_recurring?.currency_id || 'ARS'}`)
      console.log(`   📅 Frecuencia: cada ${plan.auto_recurring?.frequency || 'N/A'} ${plan.auto_recurring?.frequency_type || 'meses'}`)
      console.log(`   📊 Estado: ${plan.status}`)
      console.log(`   📱 Activo: ${plan.status === 'active' ? '✅' : '❌'}`)
      console.log(`   🎁 Trial: ${plan.auto_recurring?.free_trial?.frequency || 0} días`)
      console.log()
    })

    console.log('🔧 PRÓXIMOS PASOS:')
    console.log('==================')
    console.log('1. Copia los IDs de los planes que quieres usar')
    console.log('2. Actualiza la base de datos con estos IDs reales')
    console.log('3. ¡Listo para producción!')

  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

getMercadoPagoPlans()
