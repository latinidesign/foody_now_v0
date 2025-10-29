"use client"

import type React from "react"

import { useEffect } from "react"

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      console.log("[PWA] Registering service worker...")
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] SW registered successfully:", registration)
          console.log("[PWA] SW scope:", registration.scope)
        })
        .catch((registrationError) => {
          console.error("[PWA] SW registration failed:", registrationError)
        })
    } else {
      console.warn("[PWA] Service Workers not supported in this browser")
    }
  }, [])

  return <>{children}</>
}
