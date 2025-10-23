"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X, Share, Plus } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true

    setIsIOS(iOS)
    setIsStandalone(standalone)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    if (iOS && !standalone) {
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem("pwa-install-dismissed")
        if (!dismissed || Date.now() - Number.parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
          setShowPrompt(true)
        }
      }, 3000)

      return () => {
        clearTimeout(timer)
        window.removeEventListener("beforeinstallprompt", handler)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("PWA installed")
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Hide for 7 days
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
  }

  // Check if user dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed")
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < sevenDays) {
        setShowPrompt(false)
      }
    }
  }, [])

  if (isStandalone || (!showPrompt && !isIOS)) {
    return null
  }

  if (isIOS && showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <Card className="border-primary/20 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Instalar en iPhone</h3>
                <p className="text-xs text-muted-foreground mb-3">Para instalar esta tienda en tu iPhone:</p>
                <div className="space-y-2 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-2">
                    <Share className="w-3 h-3" />
                    <span>1. Toca el botón "Compartir" en Safari</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="w-3 h-3" />
                    <span>2. Selecciona "Añadir a pantalla de inicio"</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDismiss} variant="outline" size="sm" className="flex-1 bg-transparent">
                    Entendido
                  </Button>
                  <Button onClick={handleDismiss} variant="outline" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Instalar Foody Now</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Instala la app para acceso rápido y funciones offline
              </p>
              <div className="flex gap-2">
                <Button onClick={handleInstall} size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Instalar
                </Button>
                <Button onClick={handleDismiss} variant="outline" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
