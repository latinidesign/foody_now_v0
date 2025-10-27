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
    if (!storeId || typeof window === 'undefined') return

    // Solo en páginas de admin
    const isAdminPage = window.location.pathname.startsWith('/admin')
    if (!isAdminPage) return

    // Verificar si hay una suscripción guardada
    const checkExistingSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          if (subscription && Notification.permission === 'granted') {
            console.log('[PushNotifications] Existing subscription found')
            // La suscripción ya existe, no hacer nada
          }
        }
      } catch (error) {
        console.warn('[PushNotifications] Error checking existing subscription:', error)
      }
    }

    checkExistingSubscription()
  }, [storeId])
}
