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
    console.warn('[StoreNotifications] PWA implementation removed - notifications disabled')
    return false
  }

  // Subscribe to push notifications
  async subscribe(storeId: string): Promise<boolean> {
    console.warn('[StoreNotifications] PWA removed - subscription disabled')
    return false
  }

  // Unsubscribe from push notifications
  async unsubscribe(storeId: string): Promise<boolean> {
    console.warn('[StoreNotifications] PWA removed - unsubscribe disabled')
    return false
  }

  // Send local notification (fallback)
  showLocalNotification(payload: PushNotificationPayload) {
    console.warn('[StoreNotifications] PWA removed - local notifications disabled')
  }

  // Check if notifications are supported and enabled
  isSupported(): boolean {
    return false
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission | 'unsupported' {
    return 'unsupported'
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

// Server-side notification sending (disabled - PWA removed)
export const sendStoreNotification = async (storeId: string, payload: PushNotificationPayload) => {
  console.warn('[StoreNotifications] Sending notifications disabled - PWA removed')
  return false
}

export const storeNotificationService = StoreNotificationService.getInstance()
