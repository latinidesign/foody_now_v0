interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, unknown>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

interface StoreNotificationData {
  type: 'new_order' | 'payment_received' | 'order_cancelled'
  orderId: string
  storeId: string
  customerName: string
  total: number
  timestamp: string
}

class StoreNotificationService {
  private static instance: StoreNotificationService
  private subscription: PushSubscription | null = null

  static getInstance(): StoreNotificationService {
    if (!StoreNotificationService.instance) {
      StoreNotificationService.instance = new StoreNotificationService()
    }
    return StoreNotificationService.instance
  }

  // Initialize push notifications for store admin
  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[StoreNotifications] Push notifications not supported')
      return false
    }

    try {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        await navigator.serviceWorker.register('/sw.js')
      }

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('[StoreNotifications] Permission denied')
        return false
      }

      console.log('[StoreNotifications] Initialized successfully')
      return true
    } catch (error) {
      console.error('[StoreNotifications] Initialization failed:', error)
      return false
    }
  }

  // Subscribe to push notifications
  async subscribe(storeId: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready
      
      // Get existing subscription or create new one
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
          ),
        })
      }

      if (subscription) {
        this.subscription = subscription
        
        // Send subscription to server
        await this.saveSubscription(storeId, subscription)
        console.log('[StoreNotifications] Subscribed successfully')
        return true
      }

      return false
    } catch (error) {
      console.error('[StoreNotifications] Subscription failed:', error)
      return false
    }
  }

  // Save subscription to server
  private async saveSubscription(storeId: string, subscription: PushSubscription) {
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId,
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey('p256dh') ? 
              btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))) : '',
            auth: subscription.getKey('auth') ? 
              btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))) : '',
          },
        },
      }),
    })
  }

  // Unsubscribe from push notifications
  async unsubscribe(storeId: string): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe()
        this.subscription = null
      }

      // Remove subscription from server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      })

      console.log('[StoreNotifications] Unsubscribed successfully')
      return true
    } catch (error) {
      console.error('[StoreNotifications] Unsubscribe failed:', error)
      return false
    }
  }

  // Send local notification (fallback)
  showLocalNotification(payload: PushNotificationPayload) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('[StoreNotifications] Local notifications not supported')
      return
    }

    if (Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-72.png',
        data: payload.data,
      })
    }
  }

  // Check if notifications are supported and enabled
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  }

  // Utility to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

// Notification builders for different events
export const buildNewOrderNotification = (data: {
  orderId: string
  customerName: string
  total: number
  itemCount: number
}): PushNotificationPayload => ({
  title: '🔔 Nuevo Pedido',
  body: `${data.customerName} realizó un pedido por $${data.total.toFixed(2)} (${data.itemCount} items)`,
  icon: '/icon-192.png',
  badge: '/icon-72.png',
  data: {
    type: 'new_order',
    orderId: data.orderId,
    url: `/admin/orders/${data.orderId}`,
  },
  actions: [
    {
      action: 'view',
      title: 'Ver Pedido',
      icon: '/icon-192.png',
    },
    {
      action: 'accept',
      title: 'Aceptar',
      icon: '/icon-192.png',
    },
  ],
})

export const buildPaymentReceivedNotification = (data: {
  orderId: string
  customerName: string
  total: number
}): PushNotificationPayload => ({
  title: '💰 Pago Recibido',
  body: `Pago confirmado de ${data.customerName} por $${data.total.toFixed(2)}`,
  icon: '/icon-192.png',
  badge: '/icon-72.png',
  data: {
    type: 'payment_received',
    orderId: data.orderId,
    url: `/admin/orders/${data.orderId}`,
  },
  actions: [
    {
      action: 'view',
      title: 'Ver Pedido',
      icon: '/icon-192.png',
    },
    {
      action: 'prepare',
      title: 'Preparar',
      icon: '/icon-192.png',
    },
  ],
})

// Server-side notification sending
export const sendStoreNotification = async (storeId: string, payload: PushNotificationPayload) => {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId,
        payload,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`)
    }

    console.log('[StoreNotifications] Notification sent successfully')
    return true
  } catch (error) {
    console.error('[StoreNotifications] Failed to send notification:', error)
    return false
  }
}

export const storeNotificationService = StoreNotificationService.getInstance()
