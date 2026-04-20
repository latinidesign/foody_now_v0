"use client"

import { useEffect } from 'react'
import { whatsappQueue } from '@/lib/queue/whatsapp-queue'

export function useWhatsAppWorker() {
  useEffect(() => {
    // Solo en el cliente y si estamos en el admin
    if (typeof window === 'undefined') return

    // Verificar si estamos en una página de admin
    const isAdminPage = window.location.pathname.startsWith('/admin')
    if (!isAdminPage) return

    // Inicializar el worker de WhatsApp
    console.log('[WhatsAppWorker] Initializing WhatsApp queue worker')
    
    // El queue se auto-inicia cuando se añade el primer trabajo
    // Pero podemos hacer cleanup de trabajos antiguos al inicio
    whatsappQueue.cleanup(24)

    // Cleanup al desmontar
    return () => {
      console.log('[WhatsAppWorker] Stopping WhatsApp queue worker')
      whatsappQueue.stopProcessing()
    }
  }, [])
}

// Hook para inicializar notificaciones push
export function usePushNotifications(storeId?: string) {
  useEffect(() => {
    // PWA removed - push notifications disabled
    console.warn('[PushNotifications] PWA implementation removed - notifications disabled')
  }, [storeId])
}
