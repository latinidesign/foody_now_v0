#!/usr/bin/env node

// Script para crear una nueva cuenta de tienda en Supabase
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no encontradas')
  console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Datos de la nueva cuenta
const accountData = {
  email: 'dely@lomosnow.com.ar',
  password: '123456a',
  storeName: 'Lomos Now',
  storeSlug: 'lomosnow',
  storeDescription: 'Especialistas en lomos y comida rápida',
  storeAddress: 'Puerto Madry, Argentina',
  storePhone: '+54 11 1234-5678'
}

async function createStoreAccount() {
  console.log('🏪 Creando cuenta para Lomos Now...\n')
  
  try {
    // 1. Crear usuario en Supabase Auth
    console.log('👤 Paso 1: Creando usuario en Auth...')
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: accountData.email,
      password: accountData.password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: accountData.storeName,
        role: 'store_owner'
      }
    })

    if (authError) {
      console.error('❌ Error creando usuario:', authError.message)
      return
    }

    console.log('✅ Usuario creado:', authData.user.id)
    console.log('   Email:', authData.user.email)
    
    // 2. Crear registro en la tabla stores
    console.log('\n🏪 Paso 2: Creando tienda...')
    
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert({
        owner_id: authData.user.id,
        name: accountData.storeName,
        slug: accountData.storeSlug,
        description: accountData.storeDescription,
        address: accountData.storeAddress,
        phone: accountData.storePhone,
        is_active: true,
        // Configuración por defecto
        min_order_amount: 1000, // $1000 mínimo
        delivery_fee: 500,      // $500 delivery
        delivery_radius: 10000  // 10km radio
      })
      .select()
      .single()

    if (storeError) {
      console.error('❌ Error creando tienda:', storeError.message)
      
      // Si falló la tienda, eliminar el usuario creado
      console.log('🧹 Limpiando usuario creado...')
      await supabase.auth.admin.deleteUser(authData.user.id)
      return
    }

    console.log('✅ Tienda creada:', storeData.id)
    console.log('   Nombre:', storeData.name)
    console.log('   Slug:', storeData.slug)
    
    // 3. Crear configuración de la tienda
    console.log('\n⚙️ Paso 3: Creando configuración de tienda...')
    
    const { data: settingsData, error: settingsError } = await supabase
      .from('store_settings')
      .insert({
        store_id: storeData.id,
        // Configuraciones por defecto (se pueden cambiar después)
        theme_color: '#ff6b35',
        logo_url: null,
        cover_image_url: null,
        social_instagram: null,
        social_facebook: null,
        social_whatsapp: accountData.storePhone,
        // Configuración de notificaciones
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        // MercadoPago (vacío, se configura después)
        mercadopago_access_token: null,
        mercadopago_public_key: null,
        // WhatsApp (vacío, se configura después)
        whatsapp_phone_number_id: null,
        whatsapp_access_token: null
      })
      .select()
      .single()

    if (settingsError) {
      console.error('❌ Error creando configuración:', settingsError.message)
      console.log('⚠️ La tienda se creó pero sin configuración. Se puede agregar después.')
    } else {
      console.log('✅ Configuración creada para la tienda')
    }

    // 4. Crear algunas categorías de ejemplo
    console.log('\n📁 Paso 4: Creando categorías de ejemplo...')
    
    const categories = [
      { name: 'Lomos', description: 'Lomos completos y especiales' },
      { name: 'Hamburguesas', description: 'Hamburguesas caseras' },
      { name: 'Empanadas', description: 'Empanadas horneadas y fritas' },
      { name: 'Bebidas', description: 'Gaseosas, aguas y jugos' },
      { name: 'Postres', description: 'Postres y dulces' }
    ]

    for (const category of categories) {
      const { error: catError } = await supabase
        .from('categories')
        .insert({
          store_id: storeData.id,
          name: category.name,
          description: category.description,
          is_active: true
        })
      
      if (catError) {
        console.log(`⚠️ Error creando categoría ${category.name}:`, catError.message)
      } else {
        console.log(`✅ Categoría creada: ${category.name}`)
      }
    }

    // 5. Resumen final
    console.log('\n🎉 ¡CUENTA CREADA EXITOSAMENTE!')
    console.log('=' .repeat(50))
    console.log('📧 Email:', accountData.email)
    console.log('🔑 Contraseña:', accountData.password)
    console.log('🏪 Tienda:', accountData.storeName)
    console.log('🔗 URL:', `https://${accountData.storeSlug}.foodynow.com.ar`)
    console.log('👤 Usuario ID:', authData.user.id)
    console.log('🏪 Store ID:', storeData.id)
    console.log('\n📝 PRÓXIMOS PASOS:')
    console.log('1. Iniciar sesión en https://foodynow.com.ar/auth/signin')
    console.log('2. Configurar MercadoPago en el panel de admin')
    console.log('3. Configurar WhatsApp Business API (opcional)')
    console.log('4. Agregar productos a las categorías')
    console.log('5. Personalizar la tienda (logo, colores, etc.)')
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message)
  }
}

// Verificar si el usuario ya existe antes de crear
async function checkAndCreateAccount() {
  console.log(`🔍 Creando cuenta para: ${accountData.email}`)
  
  try {
    // Crear la cuenta directamente
    await createStoreAccount()
    
  } catch (error) {
    console.error('💥 Error creando cuenta:', error.message)
  }
}

checkAndCreateAccount().catch(console.error)
