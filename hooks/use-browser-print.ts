"use client"

import { useCallback, useRef } from "react"

export function useBrowserPrint() {
  const queueRef = useRef<Array<() => Promise<void>>>([])
  const printingRef = useRef(false)

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
          reject(new Error("No se pudo crear el documento de impresión"))
          return
        }

        doc.open()
        doc.write(html)
        doc.close()

        const win = iframe.contentWindow
        if (!win) {
          document.body.removeChild(iframe)
          reject(new Error("No se pudo acceder al contentWindow"))
          return
        }

        win.focus()

        const cleanup = () => {
          setTimeout(() => {
            if (iframe.parentNode) document.body.removeChild(iframe)
          }, 100)
          resolve()
        }

        win.onafterprint = cleanup
        win.print()
        setTimeout(cleanup, 2000)
      })
      processQueue()
    })
  }, [processQueue])

  return { print: enqueue }
}
