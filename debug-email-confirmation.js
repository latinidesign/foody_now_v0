#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de confirmación de email
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

async function debugEmailConfirmation() {
  console.log('🔍 Diagnosticando sistema de confirmación de emails')
  console.log('=================================================\n')

  try {
    // 1. Verificar configuración de Supabase
    console.log('1️⃣ Configuración de Supabase:')
    console.log(`   URL: ${supabaseUrl}`)
    console.log(`   Service Key: ${supabaseServiceKey ? 'Configurada ✅' : 'Faltante ❌'}`)
    
    // 2. Verificar usuarios recientes
    console.log('\n2️⃣ Usuarios recientes (últimas 24 horas):')
    const { data: recentUsers, error: usersError } = await supabase.auth.admin.listUsers({
      perPage: 10
    })
    
    if (usersError) {
      console.error(`   ❌ Error consultando usuarios: ${usersError.message}`)
    } else {
      const today = new Date()
      today.setDate(today.getDate() - 1)
      
      const recentSignups = recentUsers.users.filter(user => 
        new Date(user.created_at) > today
      )
      
      console.log(`   📊 Total de usuarios: ${recentUsers.users.length}`)
      console.log(`   📊 Registros recientes: ${recentSignups.length}`)
      
      recentSignups.forEach(user => {
        const confirmed = user.email_confirmed_at ? 'SÍ ✅' : 'NO ❌'
        const confirmDate = user.email_confirmed_at ? new Date(user.email_confirmed_at).toLocaleString('es-AR') : 'N/A'
        
        console.log(`   👤 ${user.email}`)
        console.log(`      Registrado: ${new Date(user.created_at).toLocaleString('es-AR')}`)
        console.log(`      Confirmado: ${confirmed}`)
        if (user.email_confirmed_at) {
          console.log(`      Fecha confirmación: ${confirmDate}`)
        }
        console.log(`      Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-AR') : 'Nunca'}`)
        console.log('')
      })
    }

    // 3. Verificar configuración de email templates
    console.log('\n3️⃣ URLs de confirmación configuradas:')
    console.log('   📋 Verifica en Supabase Dashboard → Authentication → Settings → Email Templates')
    console.log('   📋 Confirm signup template debe usar: {{ .ConfirmationURL }}')
    console.log('   📋 Site URL debe ser: https://tu-dominio.com o localhost:3000')
    console.log('   📋 Redirect URLs deben incluir:')
    console.log('      - https://tu-dominio.com/auth/confirm')
    console.log('      - http://localhost:3000/auth/confirm')

    // 4. Verificar configuración SMTP
    console.log('\n4️⃣ Configuración de email:')
    console.log('   📋 Verifica en Supabase Dashboard → Settings → Authentication')
    console.log('   📧 Enable email confirmations: debe estar habilitado')
    console.log('   📧 Enable email change confirmations: debe estar habilitado')
    console.log('   📧 Secure email change: recomendado habilitado')

    console.log('\n✅ Diagnóstico completado')
    console.log('\n📋 Pasos para resolver problemas de confirmación:')
    console.log('   1. Verificar que las URLs de redirect estén configuradas en Supabase')
    console.log('   2. Comprobar que el email template use {{ .ConfirmationURL }}')
    console.log('   3. Verificar que el dominio principal esté en Site URL')
    console.log('   4. Revisar la carpeta de spam del email')
    console.log('   5. Verificar logs de la aplicación en la consola del navegador')
    
  } catch (error) {
    console.error('💥 Error durante el diagnóstico:', error.message)
  }
}

async function testEmailConfirmationFlow(testEmail) {
  console.log(`\n🧪 Probando flujo de confirmación para: ${testEmail}`)
  console.log('========================================================')

  try {
    // Crear usuario de prueba
    console.log('1️⃣ Creando usuario de prueba...')
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: false, // No confirmar automáticamente
      user_metadata: {
        full_name: 'Test User',
        test: true
      }
    })

    if (createError) {
      console.error(`   ❌ Error creando usuario: ${createError.message}`)
      return
    }

    console.log(`   ✅ Usuario creado: ${newUser.user.id}`)
    console.log(`   📧 Estado confirmación: ${newUser.user.email_confirmed_at ? 'Confirmado' : 'Pendiente'}`)

    // Generar link de confirmación
    console.log('\n2️⃣ Generando link de confirmación...')
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: testEmail,
      options: {
        redirectTo: 'http://localhost:3000/auth/confirm'
      }
    })

    if (linkError) {
      console.error(`   ❌ Error generando link: ${linkError.message}`)
    } else {
      console.log(`   ✅ Link generado exitosamente`)
      console.log(`   🔗 URL de confirmación:`)
      console.log(`   ${linkData.properties.action_link}`)
      console.log('')
      console.log(`   📋 Para probar:`)
      console.log(`   1. Abre esta URL en el navegador`)
      console.log(`   2. Debería redirigir a /auth/confirm`)
      console.log(`   3. Verificar que aparezca "Email confirmado exitosamente"`)
    }

    // Limpiar usuario de prueba
    console.log('\n3️⃣ Limpiando usuario de prueba...')
    const { error: deleteError } = await supabase.auth.admin.deleteUser(newUser.user.id)
    
    if (deleteError) {
      console.error(`   ⚠️ No se pudo eliminar usuario de prueba: ${deleteError.message}`)
    } else {
      console.log(`   ✅ Usuario de prueba eliminado`)
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error.message)
  }
}

// Ejecutar diagnóstico
async function main() {
  await debugEmailConfirmation()
  
  // Si se proporciona un email como argumento, hacer prueba
  const testEmail = process.argv[2]
  if (testEmail && testEmail.includes('@')) {
    await testEmailConfirmationFlow(testEmail)
  } else if (testEmail) {
    console.log('\n⚠️ Email inválido proporcionado')
    console.log('💡 Uso: node debug-email-confirmation.js test@example.com')
  }
}

main().catch(console.error)
