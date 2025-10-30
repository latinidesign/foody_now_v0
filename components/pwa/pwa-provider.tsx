"use client"

import type React from "react"

import { useEffect } from "react"

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Esperar a que el DOM esté completamente cargado
    const registerSW = async () => {
      if ("serviceWorker" in navigator) {
        try {
          console.log("[PWA] Iniciando registro de Service Worker...")
          
          // Verificar si ya hay uno registrado
          const existingRegistration = await navigator.serviceWorker.getRegistration()
          if (existingRegistration) {
            console.log("[PWA] Service Worker ya registrado:", existingRegistration.scope)
            return
          }
          
          console.log("[PWA] Registrando nuevo Service Worker...")
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none"
          })
          
          console.log("[PWA] ✅ SW registrado exitosamente!")
          console.log("[PWA] Scope:", registration.scope)
          console.log("[PWA] State:", registration.installing ? "installing" : registration.waiting ? "waiting" : registration.active ? "active" : "unknown")
          
          // Verificar cuando esté listo
          await navigator.serviceWorker.ready
          console.log("[PWA] ✅ SW está listo para usar")
          
        } catch (error) {
          console.error("[PWA] ❌ Error registrando SW:", error)
        }
      } else {
        console.warn("[PWA] ❌ Service Workers no soportados en este navegador")
      }
    }
    
    // Esperar un poco para asegurar que el DOM esté listo
    setTimeout(registerSW, 100)
  }, [])

  return <>{children}</>
}
