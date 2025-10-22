#!/usr/bin/env node

const https = require("https")
const http = require("http")

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === "https:" ? https : http

    const req = client.request(url, { method: "HEAD" }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        headers: res.headers,
      })
    })

    req.on("error", (error) => {
      resolve({
        url,
        status: "ERROR",
        error: error.message,
        headers: {},
      })
    })

    req.setTimeout(10000, () => {
      req.destroy()
      resolve({
        url,
        status: "TIMEOUT",
        error: "Request timeout",
        headers: {},
      })
    })

    req.end()
  })
}

async function diagnose() {
  log(colors.cyan, "🔍 Diagnóstico de Subdominios y Cache")
  log(colors.cyan, "=====================================\n")

  const testUrls = [
    "https://foodynow.com.ar/store/pizzeria-don-mario",
    "https://pizzeria-don-mario.foodynow.com.ar/",
    "https://pizzeria-don-mario.foodynow.com.ar/menu",
    "http://localhost:3000/store/pizzeria-don-mario",
    "http://pizzeria-don-mario.localhost:3000/",
  ]

  for (const url of testUrls) {
    log(colors.yellow, `Probando: ${url}`)

    const result = await makeRequest(url)

    if (result.status === "ERROR" || result.status === "TIMEOUT") {
      log(colors.red, `  ❌ ${result.status}: ${result.error}`)
    } else {
      const statusColor =
        result.status === 200 ? colors.green : result.status >= 300 && result.status < 400 ? colors.yellow : colors.red
      log(statusColor, `  📊 Status: ${result.status}`)

      // Headers importantes para cache y routing
      const importantHeaders = [
        "cache-control",
        "x-vercel-cache",
        "x-vercel-id",
        "location",
        "content-type",
        "x-matched-path",
      ]

      importantHeaders.forEach((header) => {
        if (result.headers[header]) {
          log(colors.blue, `  📋 ${header}: ${result.headers[header]}`)
        }
      })
    }

    console.log("")
  }

  // Verificar configuración de DNS (solo informativo)
  log(colors.magenta, "📡 Configuración DNS Requerida:")
  log(colors.bright, "  A record: foodynow.com.ar → 76.76.21.21")
  log(colors.bright, "  CNAME: *.foodynow.com.ar → cname.vercel-dns.com")
  console.log("")

  // Verificar variables de entorno
  log(colors.magenta, "🔧 Variables de Entorno:")
  const requiredEnvVars = [
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]

  requiredEnvVars.forEach((envVar) => {
    const value = process.env[envVar]
    if (value) {
      log(colors.green, `  ✅ ${envVar}: ${value.substring(0, 20)}...`)
    } else {
      log(colors.red, `  ❌ ${envVar}: No configurada`)
    }
  })

  console.log("")

  // Instrucciones de revalidación
  log(colors.magenta, "🔄 Comandos de Revalidación:")
  log(colors.bright, "  # Revalidar por tag:")
  log(colors.bright, "  curl -X POST https://foodynow.com.ar/api/revalidate \\")
  log(colors.bright, '    -H "Content-Type: application/json" \\')
  log(colors.bright, '    -d \'{"tag": "store-data"}\'')
  console.log("")
  log(colors.bright, "  # Revalidar por path:")
  log(colors.bright, "  curl -X POST https://foodynow.com.ar/api/revalidate \\")
  log(colors.bright, '    -H "Content-Type: application/json" \\')
  log(colors.bright, '    -d \'{"path": "/store/pizzeria-don-mario"}\'')
  console.log("")

  // Recomendaciones
  log(colors.magenta, "💡 Recomendaciones:")
  log(colors.bright, '  • Si ves x-vercel-cache: HIT en 404, redeploy con "Skip build cache"')
  log(colors.bright, "  • Para desarrollo local, usa http://localhost:3000/store/[slug]")
  log(colors.bright, "  • Para producción, configura DNS wildcard en Vercel")
  log(colors.bright, "  • Usa /api/revalidate para limpiar cache específico")
}

if (require.main === module) {
  diagnose().catch(console.error)
}

module.exports = { diagnose }
