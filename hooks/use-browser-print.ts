"use client"

import { useCallback, useRef, useState, useEffect } from "react"

const LOG = "[BrowserPrint]"
const KIOSK_KEY = "browser_print_kiosk_confirmed"

function detectBrowser(): { isChromeOrEdge: boolean; browserName: string } {
  if (typeof navigator === "undefined") return { isChromeOrEdge: false, browserName: "ssr" }

  const ua = navigator.userAgent

  if (ua.includes("Edg/")) return { isChromeOrEdge: true, browserName: "edge" }
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return { isChromeOrEdge: true, browserName: "chrome" }
  if (ua.includes("Firefox/")) return { isChromeOrEdge: false, browserName: "firefox" }
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return { isChromeOrEdge: false, browserName: "safari" }

  return { isChromeOrEdge: false, browserName: "otro" }
}

export function useBrowserPrint() {
  const queueRef = useRef<Array<() => Promise<void>>>([])
  const printingRef = useRef(false)

  const [kioskConfirmed, setKioskConfirmed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(KIOSK_KEY) === "true"
  })

  const { isChromeOrEdge, browserName } = detectBrowser()

  useEffect(() => {
    console.log(`${LOG} Browser: ${browserName}, Chrome/Edge: ${isChromeOrEdge}, Kiosk: ${kioskConfirmed}, userAgent: ${navigator.userAgent}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const confirmKioskMode = useCallback(() => {
    localStorage.setItem(KIOSK_KEY, "true")
    setKioskConfirmed(true)
    console.log(`${LOG} Kiosk mode confirmado por el usuario`)
  }, [])

  const denyKioskMode = useCallback(() => {
    localStorage.setItem(KIOSK_KEY, "false")
    setKioskConfirmed(false)
    console.log(`${LOG} Kiosk mode denegado por el usuario`)
  }, [])

  const processQueue = useCallback(async () => {
    if (printingRef.current || queueRef.current.length === 0) return
    printingRef.current = true
    const next = queueRef.current.shift()
    if (next) {
      try { await next() } catch { /* silencioso */ }
    }
    printingRef.current = false
    processQueue()
  }, [])

  const enqueue = useCallback((html: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      queueRef.current.push(async () => {
        const start = Date.now()
        console.log(`${LOG} Inicio impresión`)

        const iframe = document.createElement("iframe")
        iframe.style.position = "fixed"
        iframe.style.top = "-9999px"
        iframe.style.left = "-9999px"
        iframe.style.width = "0"
        iframe.style.height = "0"
        document.body.appendChild(iframe)

        const doc = iframe.contentWindow?.document
        if (!doc) {
          document.body.removeChild(iframe)
          console.error(`${LOG} Error: no se pudo crear el documento de impresión`)
          reject(new Error("No se pudo crear el documento de impresión"))
          return
        }

        doc.open()
        doc.write(html)
        doc.close()
        console.log(`${LOG} Iframe creado y contenido escrito`)

        const win = iframe.contentWindow
        if (!win) {
          document.body.removeChild(iframe)
          console.error(`${LOG} Error: no se pudo acceder al contentWindow`)
          reject(new Error("No se pudo acceder al contentWindow"))
          return
        }

        win.focus()

        const elapsed = () => `${Date.now() - start}ms`

        const cleanup = () => {
          const dur = elapsed()
          setTimeout(() => {
            if (iframe.parentNode) document.body.removeChild(iframe)
          }, 100)
          console.log(`${LOG} Impresión completada (${dur})`)
          resolve()
        }

        win.onafterprint = () => {
          console.log(`${LOG} onafterprint disparado (${elapsed()})`)
          cleanup()
        }

        win.print()

        setTimeout(() => {
          console.log(`${LOG} Fallback timeout 2s (${elapsed()})`)
          cleanup()
        }, 2000)
      })
      processQueue()
    })
  }, [processQueue])

  return {
    print: enqueue,
    isChromeOrEdge,
    browserName,
    kioskConfirmed,
    confirmKioskMode,
    denyKioskMode,
  }
}

export function buildTestTicketHtml(): string {
  const now = new Date()
  const date = now.toLocaleDateString("es-AR")
  const time = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket de prueba</title>
        <style>
          @page { size: 80mm auto; margin: 5mm; }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            width: 72mm;
            margin: 0 auto;
            color: #000;
          }
          .ticket { padding: 6px; }
          .title { text-align: center; font-weight: 700; font-size: 16px; margin-bottom: 4px; }
          .meta { text-align: center; font-size: 12px; margin-bottom: 6px; }
          .section { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
          .row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; }
          .bold { font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="title">🧪 Ticket de prueba</div>
          <div class="meta">FoodyNow - Impresión automática</div>
          <div class="meta">${date} ${time}</div>
          <div class="section">
            <div class="row"><span class="bold">Producto</span><span>Precio</span></div>
            <div class="row"><span>Item de prueba 1</span><span>$ 100,00</span></div>
            <div class="row"><span>Item de prueba 2</span><span>$ 200,00</span></div>
          </div>
          <div class="section">
            <div class="row bold"><span>Total</span><span>$ 300,00</span></div>
          </div>
          <div class="meta section">Si ves este ticket, la impresión funciona correctamente.</div>
        </div>
      </body>
    </html>
  `
}
