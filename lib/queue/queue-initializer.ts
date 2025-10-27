// Inicializador automático de la cola de WhatsApp
// Este archivo se ejecuta cuando se importa el módulo

import { whatsappQueue } from './whatsapp-queue'

let initialized = false

export function initializeWhatsAppQueue() {
  if (initialized) return
  
  // Solo inicializar en el servidor
  if (typeof window === 'undefined') {
    console.log('[WhatsAppQueue] Initializing queue worker...')
    
    // La cola se inicia automáticamente cuando se encola el primer mensaje
    // pero podemos hacer limpieza inicial
    whatsappQueue.cleanup(24) // Limpiar trabajos de más de 24 horas
    
    // Programar limpieza periódica cada 6 horas
    setInterval(() => {
      whatsappQueue.cleanup(24)
    }, 6 * 60 * 60 * 1000)
    
    initialized = true
    console.log('[WhatsAppQueue] Queue worker initialized')
  }
}

// Auto-inicializar cuando se importa este módulo
initializeWhatsAppQueue()

// Re-exportar todo de whatsapp-queue
export * from './whatsapp-queue'
export { whatsappQueue }
