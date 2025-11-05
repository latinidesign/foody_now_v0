#!/usr/bin/env node

// Script para crear el sistema de suscripciones en la base de datos
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSQLFile(filePath, description) {
  try {
    console.log(`\n🔄 ${description}...`)
    
    const sqlContent = fs.readFileSync(filePath, 'utf8')
    
    // Dividir el archivo SQL en declaraciones individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Ejecutando ${statements.length} declaraciones SQL...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Saltar comentarios y declaraciones vacías
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }
      
      try {
        // Para Supabase, necesitamos usar rpc con una función personalizada
        // o hacer las consultas una por una
        
        // Intentar ejecutar directamente con .rpc() si está disponible
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          throw error
        }
        
        successCount++
        
        // Mostrar progreso cada 5 declaraciones
        if ((i + 1) % 5 === 0) {
          console.log(`   ✓ Progreso: ${i + 1}/${statements.length}`)
        }
        
      } catch (error) {
        // Si exec_sql no está disponible, intentar ejecutar consultas directamente
        if (error.message && error.message.includes('exec_sql')) {
          console.log('⚠️  exec_sql no disponible, usando método directo...')
          
          // Para CREATE TABLE, CREATE TYPE, etc., usar una estrategia diferente
          try {
            // Ejecutar usando el SQL editor approach
            await executeDirectSQL(statement)
            successCount++
          } catch (directError) {
            console.error(`❌ Error en declaración ${i + 1}:`, directError.message)
            errorCount++
          }
        } else {
          console.error(`❌ Error en declaración ${i + 1}:`, error.message)
          errorCount++
        }
      }
    }
    
    console.log(`✅ ${description} completado:`)
    console.log(`   - Exitosas: ${successCount}`)
    console.log(`   - Errores: ${errorCount}`)
    
    return { successCount, errorCount }
    
  } catch (error) {
    console.error(`💥 Error ejecutando ${description}:`, error)
    throw error
  }
}

async function executeDirectSQL(statement) {
  // Para declaraciones DDL, intentar usar métodos específicos de Supabase
  if (statement.includes('CREATE TABLE') || statement.includes('CREATE TYPE')) {
    // Estos necesitan ser ejecutados en el SQL Editor de Supabase
    throw new Error('DDL statements need to be executed in Supabase SQL Editor')
  }
  
  // Para INSERT, UPDATE, DELETE, usar métodos directos
  const { data, error } = await supabase.rpc('exec', { query: statement })
  
  if (error) {
    throw error
  }
  
  return data
}

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...')
    
    const { data, error } = await supabase
      .from('stores')
      .select('id')
      .limit(1)
    
    if (error) {
      throw error
    }
    
    console.log('✅ Conexión a la base de datos exitosa')
    return true
    
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error)
    return false
  }
}

async function showInstructions() {
  console.log('\n' + '='.repeat(80))
  console.log('📋 INSTRUCCIONES PARA COMPLETAR LA INSTALACIÓN')
  console.log('='.repeat(80))
  console.log('\nDado que algunas declaraciones DDL requieren privilegios especiales,')
  console.log('necesitas ejecutar los scripts SQL manualmente en Supabase:')
  console.log('\n1. Ve al SQL Editor de Supabase:')
  console.log('   https://brubhbfkzehcqclivaxb.supabase.co/project/default/sql')
  console.log('\n2. Ejecuta los siguientes archivos en orden:')
  console.log('   a) scripts/subscription-system.sql')
  console.log('   b) scripts/migrate-existing-stores-subscriptions.sql')
  console.log('\n3. Cada archivo tiene comentarios explicativos sobre qué hace')
  console.log('\n4. Después de ejecutar ambos scripts, las suscripciones estarán listas')
  console.log('\n' + '='.repeat(80))
}

async function main() {
  try {
    console.log('🚀 Iniciando instalación del sistema de suscripciones...')
    
    // Verificar conexión
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      process.exit(1)
    }
    
    // Verificar que los archivos SQL existen
    const subscriptionSystemPath = path.join(__dirname, 'scripts', 'subscription-system.sql')
    const migrationPath = path.join(__dirname, 'scripts', 'migrate-existing-stores-subscriptions.sql')
    
    if (!fs.existsSync(subscriptionSystemPath)) {
      console.error('❌ Error: No se encuentra subscription-system.sql')
      process.exit(1)
    }
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Error: No se encuentra migrate-existing-stores-subscriptions.sql')
      process.exit(1)
    }
    
    console.log('✅ Archivos SQL encontrados')
    
    // Mostrar instrucciones debido a limitaciones de DDL en Supabase JS
    await showInstructions()
    
    // Verificar si ya existen las tablas
    console.log('\n🔍 Verificando si el sistema ya está instalado...')
    
    try {
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id')
        .limit(1)
      
      if (plans && plans.length > 0) {
        console.log('⚠️  El sistema de suscripciones ya parece estar instalado')
        console.log('   Se encontraron planes de suscripción existentes')
      }
    } catch (error) {
      console.log('ℹ️  Sistema no instalado aún (esto es normal)')
    }
    
  } catch (error) {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  }
}

main()
  .then(() => {
    console.log('\n🎉 Script completado. Sigue las instrucciones arriba para finalizar la instalación.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
