"use client"

import { useState, useEffect, useCallback } from "react"

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed'

interface QzTrayState {
  available: boolean
  connectionStatus: ConnectionStatus
  attempt: number
  maxAttempts: number
}

interface UseQzTrayReturn {
  isAvailable: boolean
  connectionStatus: ConnectionStatus
  attempt: number
  maxAttempts: number
  print: (html: string, jobName?: string) => Promise<void>
  retry: () => void
}

// ── Certificado y clave de desarrollo ──
// Solo incluidos en builds de desarrollo. Tree-shaken en producción.
// En producción se usa server-side signing via /api/qz/sign.
if (process.env.NODE_ENV === "development") {
  var DEV_CERT = `-----BEGIN CERTIFICATE-----
MIIECzCCAvOgAwIBAgIGAZ6obMouMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQG
EwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwS
UVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMx
HDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkg
RGVtbyBDZXJ0MB4XDTI2MDYwNzE4MDkyMloXDTQ2MDYwNzE4MDkyMlowgaIxCzAJ
BgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYD
VQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMs
IExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVog
VHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCy
c+j7po9wECUIPtIDi43nlhcVCeyqB4pHdNTm88CSpHj8grN5rKPYYGTeY6owDPyL
s0L/z/lNQJjlUJuqwqeLsu5ETSv7C+w39sSDBrn+BS/EP7JV2PzPoF30m9sBNiVD
q61eLeeo9jHl8j2HDPfM9ty2dGO33cj71peya+OfV/vE9CNpFLgu2O4BtvOKtjkO
++RnPPbWiPGZ1/KIIR6OL9pLFjpSkMb0mWTdHOm/sdAc3jQXTVduN5902NVMHuEz
ovlgo4yD66xogtznCcr3e4CprU9CnP7Gefvuk/heXUA9kaj5lSW+zApR6k+b1W3P
dRIfSgwXfw99Vw+WpEopAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYD
VR0PAQH/BAQDAgEGMB0GA1UdDgQWBBS8GbsDxjKnesGzEGU+c0Iu3IobcTANBgkq
hkiG9w0BAQsFAAOCAQEAdeyJURHZoo67A5+M95rcAsGrmouLXKp1xBGB6KgZdTOG
A9HMZKXzg1zAHiDhTKXhGHRi6TbCe2le8DNfdt4w2ACK6vNxM8nMSgcGS6+Cmh8/
eeO8XzbAVih++JU0hMhhN0tmP1oEL3mR5kYw23Q2u0Ndn/hLNZ4lBR6SYu+24SU3
uM+bF/c0rmTCHgmVrxKWCPfvgiRYnuTIORSBOfyC+8fXxm1AGSwCdWkemQVPC7Iv
/ObHCgV39ITpkhVhYAnqLty9g44xHcTsv61RuKYBGw7043gKb1xuFv1CHYYYGTrd
FH7wtvrSJKeNeW8qGxQqce6SKhHchvVhxod89MiIaw==
-----END CERTIFICATE-----`

  var DEV_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCyc+j7po9wECUI
PtIDi43nlhcVCeyqB4pHdNTm88CSpHj8grN5rKPYYGTeY6owDPyLs0L/z/lNQJjl
UJuqwqeLsu5ETSv7C+w39sSDBrn+BS/EP7JV2PzPoF30m9sBNiVDq61eLeeo9jHl
8j2HDPfM9ty2dGO33cj71peya+OfV/vE9CNpFLgu2O4BtvOKtjkO++RnPPbWiPGZ
1/KIIR6OL9pLFjpSkMb0mWTdHOm/sdAc3jQXTVduN5902NVMHuEzovlgo4yD66xo
gtznCcr3e4CprU9CnP7Gefvuk/heXUA9kaj5lSW+zApR6k+b1W3PdRIfSgwXfw99
Vw+WpEopAgMBAAECggEAC06ilSZLerEmnmezdcl5WYBZrhC7fZ8gHZyw8Mp5HBq3
zYOYTNA8JhEern+Mcsb7TiEOPk9I8ccFe2I7A/wHN3Efj8xa3HulfJ9yML14Xu+E
DZdLoXqds17Ggv1IkXleiM8mP+e3ky24oWQuRUj0fy+ncjy4ADzHDITfPYQS1nif
51Jsvd/2smytHTk4tZTm5LT4+fXRXelZ+dLHte8ZytxEHrf/C4V18XjaL/WcS3vg
yt5aJsByfHQWFa42bM2/FDD9IVzzu3uPC/0I9peKX+6ecTJS9zQU4IGldO9dUeCL
jDKgKHPp5UvJiYtILyLusyAKeB6ydw+EVUUzzt/MkQKBgQDY9qSuAP+PzAndupak
RdCHyo+5XMQnQgA/IlEeZq8PcpOLC7ATGSIbB/kB8Oo945AVBJrCk2zX/jv4FTLd
YyNAOIMXDOUG1X1A0j9iL+pVDdha6WYVFPmytLwcocUch2LR53+UKkvOugSnj71J
sAKE7R4RM8S+HyhH4+26H7inJwKBgQDSj3Yif0oa4y6hMX5Ipk7sdNVuNy4HU8I7
IYY9qga8qONJLjxnwY5tWu2pbwvVrZ7XveL2U31uePvQey2WtPno7/0IZ3v623X6
rLvdRTNXA+QjHtFGV+ZCl46m2NKqTa+7Fj6xYiWCakWbtcuwIioOPVcd3gbsmREQ
7hwnYcXWLwKBgCLX8XiUZnaUgR0f4yN8ptG4AT72m/XmDp4VB8wHF6Q2dWWGOf/H
MIgAzse2BhhsXG5Tr/sBrCBADyd3WBTf4ABnUv43ruxbCuOHIHDHWy3PrGhlRWSr
WrKNfgxnGn3LbF5jfESySjxn+WljlzWnU7A/WG3Qz47s+A4bl8klYQVPAoGAQeov
LTVz2V7tJgD8a3nEkzkv50TW3+xUjXY9M+iaG00zeaFDv6dUEt+4LqZYqhej9h23
gy03wvGUwvsMlnUpFsaqC4t5wFobYNHaLbaQD9lj/aqUENVLe+U9/vU5XZ7cOFEK
ZzU2UNE74TbUANtxFuwU7YCn4kE4mngv0BRHfnkCgYEA1Cd0rLLzwH1So+anKONl
j7UH2dX9SBuCWhTcn9j6cPzgqs9W8kyZ5KJALrT1zEsN+i7W/xLQS7VzXplHkSIi
RW8LLHC2ksx2AiPz+cCnb1zwB5eJi+fk9wb996YD1j3kilkFsVzjEF7ez7t5Xrgl
ivdST22eTYbxOW3mYSft+RU=
-----END PRIVATE KEY-----`
}

// ── Module-level singleton ──
// Connection persists across component mounts and page navigations.
// The WebSocket is never intentionally disconnected — it lives as long as the browser tab.
let qzModule: any = null
let connectionPromise: Promise<void> | null = null
let qzAcknowledged = false // QZ Tray server-side accepted our origin at least once
const MAX_ATTEMPTS = 3

let currentState: QzTrayState = {
  available: false,
  connectionStatus: 'connecting',
  attempt: 0,
  maxAttempts: MAX_ATTEMPTS,
}

const listeners = new Set<() => void>()
const LOG_PREFIX = "[QZ Tray]"
const LAST_CONNECTION_ERROR_KEY = "qz_last_connection_error"

// ── Helpers para firma criptográfica (solo desarrollo) ──
// Tree-shaken en producción. En prod se usa server-side signing via /api/qz/sign.
if (process.env.NODE_ENV === "development") {

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s/g, "")
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

let cryptoKey: CryptoKey | null = null

async function getCryptoKey(): Promise<CryptoKey> {
  if (cryptoKey) return cryptoKey
  const keyData = pemToArrayBuffer(DEV_KEY)
  cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" },
    false,
    ["sign"]
  )
  console.log(`${LOG_PREFIX} Clave privada importada para firma.`)
  return cryptoKey
}

async function signRequest(toSign: string): Promise<string> {
  const key = await getCryptoKey()
  const data = new TextEncoder().encode(toSign)
  const sig = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, key, data)
  return arrayBufferToBase64(sig)
}

} // end dev-only helpers

let signingConfigured = false

async function setupSigning(qz: any): Promise<void> {
  if (signingConfigured) return
  console.log(`${LOG_PREFIX} Configurando firma de requests...`)

  if (process.env.NODE_ENV === "development") {
    // Desarrollo: firma client-side con claves hardcodeadas
    qz.security.setCertificatePromise((resolve: (cert: string) => void) => resolve(DEV_CERT))
    qz.security.setSignaturePromise((toSign: string) => {
      return (resolve: (sig: string) => void, reject: (err: any) => void) => {
        signRequest(toSign).then(resolve).catch(reject)
      }
    })
  } else {
    // Producción: firma server-side via API endpoints
    qz.security.setCertificatePromise((resolve: (cert: string) => void) => {
      fetch("/api/qz/certificate")
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text() })
        .then(resolve)
        .catch((err) => console.error(`${LOG_PREFIX} Error obteniendo certificado:`, err))
    })
    qz.security.setSignatureAlgorithm("SHA512")
    qz.security.setSignaturePromise((toSign: string) => {
      return (resolve: (sig: string) => void, reject: (err: any) => void) => {
        fetch("/api/qz/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toSign }),
        })
          .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
          .then((data) => resolve(data.signature))
          .catch(reject)
      }
    })
  }

  signingConfigured = true
  console.log(`${LOG_PREFIX} Firma de requests configurada.`)
}

async function getQz(): Promise<any> {
  if (!qzModule) {
    console.log(`${LOG_PREFIX} Importando módulo qz-tray...`)
    qzModule = (await import("qz-tray")).default
    console.log(`${LOG_PREFIX} Módulo qz-tray importado. version:`, qzModule.version)
    await setupSigning(qzModule)
  }
  return qzModule
}

function notifyAll(state: QzTrayState) {
  if (
    currentState.available === state.available &&
    currentState.connectionStatus === state.connectionStatus &&
    currentState.attempt === state.attempt &&
    currentState.maxAttempts === state.maxAttempts
  ) {
    return
  }
  currentState = state
  if (state.connectionStatus === 'connected') {
    localStorage.setItem(LAST_CONNECTION_ERROR_KEY, 'false')
  } else if (state.connectionStatus === 'failed') {
    localStorage.setItem(LAST_CONNECTION_ERROR_KEY, 'true')
  }
  console.log(`${LOG_PREFIX} Notificando ${listeners.size} listener(s):`, state)
  listeners.forEach((fn) => fn())
}

function isEffectivelyConnected(): boolean {
  const wsOpen = qzModule?.websocket?.isActive?.() ?? false
  const effective = wsOpen || qzAcknowledged
  console.log(`${LOG_PREFIX} isEffectivelyConnected: wsOpen=${wsOpen} qzAcknowledged=${qzAcknowledged} → ${effective}`)
  return effective
}

function retryConnection(): void {
  console.log(`${LOG_PREFIX} Retry solicitado. Reseteando estado...`)
  qzAcknowledged = false
  connectionPromise = null
  notifyAll({
    available: false,
    connectionStatus: 'connecting',
    attempt: 0,
    maxAttempts: MAX_ATTEMPTS,
  })
  setTimeout(() => connectOnce(), 0)
}

async function connectOnce(): Promise<void> {
  const qz = await getQz()
  console.log(`${LOG_PREFIX} connectOnce() iniciado. wsOpen=${qz.websocket.isActive?.()}, qzAcknowledged=${qzAcknowledged}, pending=${!!connectionPromise}`)

  // Client-side WebSocket is open — nothing to do
  if (qz.websocket.isActive?.()) {
    console.log(`${LOG_PREFIX} WebSocket ya está abierto, saltando conexión.`)
    qzAcknowledged = true
    notifyAll({ available: true, connectionStatus: 'connected', attempt: 0, maxAttempts: MAX_ATTEMPTS })
    return
  }

  // QZ Tray already accepted us in a previous session — don't poke the connection
  if (qzAcknowledged) {
    console.log(`${LOG_PREFIX} QZ Tray ya nos aceptó previamente, saltando conexión.`)
    notifyAll({ available: true, connectionStatus: 'connected', attempt: 0, maxAttempts: MAX_ATTEMPTS })
    return
  }

  // Connection attempt already in progress — wait for it
  if (connectionPromise) {
    console.log(`${LOG_PREFIX} Intento de conexión ya en progreso, esperando...`)
    return connectionPromise
  }

  console.log(`${LOG_PREFIX} Iniciando nuevo intento de conexión (máx ${MAX_ATTEMPTS} reintentos)...`)
  connectionPromise = (async () => {
    const retryDelayMs = 2000

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`${LOG_PREFIX} Intento ${attempt}/${MAX_ATTEMPTS} de qz.websocket.connect()...`)
      notifyAll({
        available: false,
        connectionStatus: 'connecting',
        attempt,
        maxAttempts: MAX_ATTEMPTS,
      })

      try {
        await qz.websocket.connect()
        console.log(`${LOG_PREFIX} Conexión exitosa en intento ${attempt}.`)
        qzAcknowledged = true
        notifyAll({
          available: true,
          connectionStatus: 'connected',
          attempt,
          maxAttempts: MAX_ATTEMPTS,
        })
        return
      } catch (error: any) {
        const msg = error?.message ?? String(error)

        // QZ Tray server-side still has us registered from before.
        if (msg.includes("already exists")) {
          console.log(`${LOG_PREFIX} QZ Tray reporta conexión ya existente. Marcando como conectado.`)
          qzAcknowledged = true
          notifyAll({
            available: true,
            connectionStatus: 'connected',
            attempt,
            maxAttempts: MAX_ATTEMPTS,
          })
          return
        }

        console.warn(`${LOG_PREFIX} Intento ${attempt} fallido:`, msg)
        if (attempt < MAX_ATTEMPTS) {
          console.log(`${LOG_PREFIX} Esperando ${retryDelayMs}ms antes del reintento...`)
          await new Promise((res) => setTimeout(res, retryDelayMs))
        }
      }
    }

    console.warn(`${LOG_PREFIX} Todos los intentos de conexión fallaron.`)
    qzAcknowledged = false
    notifyAll({
      available: false,
      connectionStatus: 'failed',
      attempt: MAX_ATTEMPTS,
      maxAttempts: MAX_ATTEMPTS,
    })
  })()

  try {
    await connectionPromise
  } finally {
    connectionPromise = null
    console.log(`${LOG_PREFIX} connectOnce() finalizado.`)
  }
}

export function useQzTray(): UseQzTrayReturn {
  const [qzState, setQzState] = useState<QzTrayState>(() => {
    if (isEffectivelyConnected()) {
      return {
        available: true,
        connectionStatus: 'connected',
        attempt: 0,
        maxAttempts: MAX_ATTEMPTS,
      }
    }
    return {
      available: false,
      connectionStatus: 'connecting',
      attempt: 0,
      maxAttempts: MAX_ATTEMPTS,
    }
  })

  useEffect(() => {
    const callback = () => setQzState(currentState)
    listeners.add(callback)

    if (!isEffectivelyConnected()) {
      setTimeout(() => connectOnce(), 0)
    }

    return () => {
      listeners.delete(callback)
    }
  }, [])

  const print = useCallback(async (html: string, jobName?: string): Promise<void> => {
    console.log(`${LOG_PREFIX} print() llamado. HTML length: ${html.length}, jobName: ${jobName || "(sin nombre)"}`)
    console.log(`${LOG_PREFIX} HTML preview (primeros 200 chars):`, html.slice(0, 200))
    const qz = await getQz()

    if (!qz.websocket.isActive?.()) {
      console.log(`${LOG_PREFIX} WebSocket no está abierto, llamando connectOnce()...`)
      await connectOnce()
    }

    console.log(`${LOG_PREFIX} Estado pre-impresión: isActive=${qz.websocket.isActive?.()}, qzAcknowledged=${qzAcknowledged}`)

    console.log(`${LOG_PREFIX} Obteniendo impresora predeterminada...`)
    const printerName = await qz.printers.getDefault()
    console.log(`${LOG_PREFIX} Impresora predeterminada: "${printerName}"`)

    const configOpts: any = {}
    if (jobName) {
      configOpts.jobName = jobName
    }
    const config = qz.configs.create(printerName, configOpts)
    console.log(`${LOG_PREFIX} Configuración creada.`)

    const printData = {
      type: "pixel",
      format: "html",
      flavor: "plain", // sin esto QZ Tray interpreta data como ruta de archivo
      data: html,
    }
    console.log(`${LOG_PREFIX} Enviando a imprimir (type=pixel, format=html, flavor=plain)...`)
    await qz.print(config, [printData])
    console.log(`${LOG_PREFIX} Impresión enviada exitosamente.`)
  }, [])

  const retry = useCallback(() => {
    retryConnection()
  }, [])

  return {
    isAvailable: qzState.available,
    connectionStatus: qzState.connectionStatus,
    attempt: qzState.attempt,
    maxAttempts: qzState.maxAttempts,
    print,
    retry,
  }
}
