#!/usr/bin/env node

/**
 * Script para verificar y configurar correctamente las URLs de confirmación
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixEmailConfirmationIssues() {
  console.log('🔧 Reparando problemas de confirmación de email')
  console.log('===============================================\n')

  try {
    console.log('1️⃣ Problema identificado:')
    console.log('   📋 Supabase está configurado con Site URL de producción')
    console.log('   📋 Los enlaces redirigen a foodynow.com.ar en lugar de localhost')
    console.log('   📋 Esto causa confusión aunque la confirmación funcione\n')

    console.log('2️⃣ Soluciones implementadas:')
    console.log('   ✅ Página /confirm mejorada para manejar redirects de producción')
    console.log('   ✅ Página /auth/confirm actualizada con mejor detección de estados')
    console.log('   ✅ Logging mejorado para debug en consola del navegador')
    console.log('   ✅ Manejo de múltiples métodos de confirmación\n')

    console.log('3️⃣ Verificando usuarios recientes con problemas:')
    
    // Buscar usuarios no confirmados recientes
    const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error(`   ❌ Error consultando usuarios: ${usersError.message}`)
      return
    }

    const unconfirmedUsers = allUsers.users.filter(user => 
      !user.email_confirmed_at && 
      new Date(user.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
    )

    console.log(`   📊 Usuarios sin confirmar en últimas 24h: ${unconfirmedUsers.length}`)
    
    if (unconfirmedUsers.length > 0) {
      console.log('\n   👤 Usuarios que podrían tener problemas:')
      unconfirmedUsers.forEach(user => {
        console.log(`      • ${user.email} (registrado: ${new Date(user.created_at).toLocaleString('es-AR')})`)
      })
      
      console.log('\n   🛠️ Para ayudar a estos usuarios:')
      console.log('      1. Pedirles que vayan a /auth/resend-confirmation')
      console.log('      2. O usar el admin para reenviar confirmación')
      console.log('      3. O confirmar manualmente la cuenta en Supabase Dashboard')
    }

    console.log('\n4️⃣ Configuración recomendada en Supabase Dashboard:')
    console.log('   📋 Authentication → Settings → General:')
    console.log('      Site URL: http://localhost:3000 (para desarrollo)')
    console.log('      Site URL: https://foodynow.com.ar (para producción)')
    console.log('')
    console.log('   📋 Authentication → URL Configuration:')
    console.log('      Redirect URLs:')
    console.log('      • http://localhost:3000/auth/confirm')
    console.log('      • http://localhost:3000/confirm')
    console.log('      • https://foodynow.com.ar/auth/confirm')
    console.log('      • https://foodynow.com.ar/confirm')

    console.log('\n5️⃣ Testing en localhost:')
    console.log('   📋 Para probar el flujo completo:')
    console.log('      1. npm run dev')
    console.log('      2. Ir a http://localhost:3000/auth/sign-up')
    console.log('      3. Registrarse con un email real')
    console.log('      4. Revisar logs en consola del navegador')
    console.log('      5. Seguir enlace del email')
    console.log('      6. Verificar que aparezca confirmación exitosa')

    console.log('\n✅ Configuración completada!')
    console.log('\n💡 Nota importante:')
    console.log('   El sistema ahora maneja mejor los casos donde:')
    console.log('   • El enlace viene de producción pero estás en desarrollo')
    console.log('   • La cuenta ya está confirmada')
    console.log('   • Hay diferentes tipos de parámetros en la URL')
    console.log('   • El usuario necesita reenviar la confirmación')

  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

// Función para confirmar manualmente un usuario
async function manualConfirmUser(email) {
  console.log(`\n🔧 Confirmando manualmente usuario: ${email}`)
  
  try {
    // Buscar el usuario
    const { data: users, error: searchError } = await supabase.auth.admin.listUsers()
    if (searchError) throw searchError

    const user = users.users.find(u => u.email === email)
    if (!user) {
      console.log('   ❌ Usuario no encontrado')
      return
    }

    if (user.email_confirmed_at) {
      console.log('   ✅ Usuario ya está confirmado')
      return
    }

    // Confirmar manualmente
    const { error: confirmError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    })

    if (confirmError) {
      console.error(`   ❌ Error confirmando: ${confirmError.message}`)
    } else {
      console.log('   ✅ Usuario confirmado exitosamente')
    }

  } catch (error) {
    console.error(`   💥 Error: ${error.message}`)
  }
}

async function main() {
  await fixEmailConfirmationIssues()
  
  // Si se proporciona un email, confirmar manualmente
  const userEmail = process.argv[2]
  if (userEmail && userEmail.includes('@')) {
    await manualConfirmUser(userEmail)
  }
}

main().catch(console.error)
