#!/usr/bin/env node

/**
 * Script para configurar correctamente las URLs de Supabase para desarrollo
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

async function fixSupabaseConfiguration() {
  console.log('🔧 Configurando Supabase para desarrollo local')
  console.log('==============================================\n')

  console.log('🔍 PROBLEMA IDENTIFICADO:')
  console.log('   📋 Link de confirmación redirige a producción: https://foodynow.com.ar')
  console.log('   📋 Debería redirigir a desarrollo: http://localhost:3000/auth/confirm')
  console.log('   📋 Error: otp_expired indica que el token expiró\n')

  console.log('⚙️ CONFIGURACIÓN ACTUAL EN SUPABASE:')
  console.log('   📋 Site URL: https://foodynow.com.ar (PRODUCCIÓN)')
  console.log('   📋 Redirect URLs: Probablemente solo incluye producción\n')

  console.log('✅ CONFIGURACIÓN REQUERIDA:')
  console.log('   📋 En Supabase Dashboard → Authentication → Settings:')
  console.log('   ')
  console.log('   1️⃣ Site URL:')
  console.log('      http://localhost:3000 (para desarrollo)')
  console.log('   ')
  console.log('   2️⃣ Redirect URLs (agregar todas):')
  console.log('      http://localhost:3000/auth/confirm')
  console.log('      http://localhost:3000/confirm')  
  console.log('      https://foodynow.com.ar/auth/confirm')
  console.log('      https://foodynow.com.ar/confirm')
  console.log('   ')
  console.log('   3️⃣ Email Templates → Confirm signup:')
  console.log('      Subject: Confirm your signup')
  console.log('      Body HTML: <a href="{{ .ConfirmationURL }}">Confirm your email</a>')
  console.log('')

  // Generar nuevo enlace para el usuario que falló
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers()
    if (error) throw error

    const unconfirmedUser = users.users.find(u => 
      u.email === 'fooodynow.ar@gmail.com' && !u.email_confirmed_at
    )

    if (unconfirmedUser) {
      console.log('🔄 GENERANDO NUEVO ENLACE DE CONFIRMACIÓN:')
      console.log(`   👤 Usuario: ${unconfirmedUser.email}`)

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: unconfirmedUser.email,
        options: {
          redirectTo: 'http://localhost:3000/auth/confirm'
        }
      })

      if (linkError) {
        console.error(`   ❌ Error generando link: ${linkError.message}`)
      } else {
        console.log(`   ✅ Nuevo enlace generado:`)
        console.log(`   🔗 ${linkData.properties.action_link}`)
        console.log('')
        console.log('   📋 Para usar:')
        console.log('   1. Copia este enlace en el navegador')
        console.log('   2. Asegúrate de que localhost:3000 esté corriendo')
        console.log('   3. Debería funcionar correctamente')
      }
    }
  } catch (error) {
    console.error('❌ Error generando enlace:', error.message)
  }

  console.log('\n🚀 PASOS INMEDIATOS:')
  console.log('   1. Ir a https://supabase.com/dashboard/projects')
  console.log('   2. Seleccionar tu proyecto')
  console.log('   3. Authentication → Settings → General')
  console.log('   4. Cambiar Site URL a: http://localhost:3000')
  console.log('   5. Authentication → URL Configuration')
  console.log('   6. Agregar todas las Redirect URLs listadas arriba')
  console.log('   7. Guardar cambios')
  console.log('   8. Probar registro nuevo')

  console.log('\n💡 ALTERNATIVA RÁPIDA:')
  console.log('   Si no puedes cambiar la configuración ahora:')
  console.log('   1. Usar el enlace generado arriba directamente')
  console.log('   2. O confirmar manualmente el usuario con:')
  console.log('      node fix-email-confirmation.js fooodynow.ar@gmail.com')
}

async function manualConfirmUser(email) {
  console.log(`\n🔧 Confirmando manualmente: ${email}`)
  
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers()
    if (error) throw error

    const user = users.users.find(u => u.email === email)
    if (!user) {
      console.log('   ❌ Usuario no encontrado')
      return
    }

    if (user.email_confirmed_at) {
      console.log('   ✅ Usuario ya confirmado')
      return
    }

    const { error: confirmError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true
    })

    if (confirmError) {
      console.error(`   ❌ Error: ${confirmError.message}`)
    } else {
      console.log('   ✅ Usuario confirmado manualmente')
      console.log('   📧 Ya puede iniciar sesión')
    }

  } catch (error) {
    console.error(`   💥 Error: ${error.message}`)
  }
}

async function main() {
  await fixSupabaseConfiguration()
  
  // Si se proporciona un email, confirmar manualmente
  const userEmail = process.argv[2]
  if (userEmail && userEmail.includes('@')) {
    await manualConfirmUser(userEmail)
  }
}

main().catch(console.error)
