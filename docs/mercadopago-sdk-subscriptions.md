# SDK de MercadoPago para Suscripciones - FoodyNow

## Descripción

Este SDK proporciona una implementación completa para manejar suscripciones de comercios utilizando MercadoPago como proveedor de pagos. Incluye funcionalidades para crear, gestionar y sincronizar suscripciones, así como manejar webhooks y pagos.

## Estructura

```
lib/
├── payments/providers/
│   └── mercadopago-subscriptions.ts    # SDK principal de MercadoPago
├── services/
│   └── subscription-service.ts         # Servicio de alto nivel
├── types/
│   └── subscription.ts                 # Tipos TypeScript
└── utils/
    └── subscription-utils.ts            # Utilidades y helpers

components/subscription/
└── subscription-manager.tsx             # Componente React para gestión

app/api/subscription/
├── create/route.ts                     # Crear suscripción
├── plans-new/route.ts                  # Gestión de planes
├── store/[storeId]/route.ts           # Info de suscripción
├── store/[storeId]/manage/route.ts    # Pausar/reanudar
├── sync/[subscriptionId]/route.ts     # Sincronizar
└── webhook-new/route.ts               # Webhooks
```

## Instalación y Configuración

### 1. Variables de Entorno

```env
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your_access_token_here
MERCADOPAGO_CLIENT_ID=your_client_id_here
MERCADOPAGO_CLIENT_SECRET=your_client_secret_here

# App
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### 2. Dependencias

El SDK utiliza las siguientes dependencias que ya están instaladas:

- `mercadopago`: SDK oficial de MercadoPago
- `@supabase/supabase-js`: Base de datos
- `next`: Framework React

## Uso del SDK

### Crear una Suscripción

```typescript
import { getSubscriptionService } from '@/lib/services/subscription-service'

const subscriptionService = getSubscriptionService()

// Crear suscripción
const result = await subscriptionService.createSubscription({
  storeId: 'store_123',
  planId: 'plan_456',
  payerEmail: 'usuario@email.com',
  cardToken: 'card_token_123' // Opcional
})

// Redirigir al checkout
window.location.href = result.initPoint
```

### Gestionar Suscripciones

```typescript
// Obtener suscripción actual
const subscription = await subscriptionService.getSubscription('store_123')

// Pausar suscripción
await subscriptionService.pauseSubscription('store_123')

// Reanudar suscripción
await subscriptionService.resumeSubscription('store_123')

// Cancelar suscripción
await subscriptionService.cancelSubscription('store_123')

// Sincronizar con MercadoPago
await subscriptionService.syncSubscriptionStatus('subscription_123')
```

### Crear Planes

```typescript
const plan = await subscriptionService.createPlan({
  name: 'basic',
  display_name: 'Plan Básico',
  price: 36000,
  billing_frequency: 'monthly',
  trial_period_days: 15,
  features: ['Feature 1', 'Feature 2'],
  is_active: true
})
```

## API Endpoints

### POST /api/subscription/create

Crea una nueva suscripción.

**Request Body:**
```json
{
  "storeId": "store_123",
  "planId": "plan_456",
  "payerEmail": "usuario@email.com",
  "cardToken": "card_token_123"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": { ... },
  "init_point": "https://mercadopago.com/checkout/...",
  "preapproval_id": "preapproval_123"
}
```

### GET /api/subscription/plans-new

Obtiene todos los planes disponibles.

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "plan_123",
      "name": "basic",
      "display_name": "Plan Básico",
      "price": 36000,
      "billing_frequency": "monthly",
      "trial_period_days": 15,
      "features": ["Feature 1", "Feature 2"]
    }
  ]
}
```

### GET /api/subscription/store/[storeId]

Obtiene información de la suscripción de una tienda.

**Response:**
```json
{
  "subscription": { ... },
  "active": true,
  "trial": {
    "inTrial": true,
    "daysLeft": 10
  }
}
```

### DELETE /api/subscription/store/[storeId]

Cancela la suscripción de una tienda.

### PUT /api/subscription/store/[storeId]/manage

Pausa o reanuda una suscripción.

**Request Body:**
```json
{
  "action": "pause" // o "resume"
}
```

### POST /api/subscription/sync/[subscriptionId]

Sincroniza el estado de una suscripción con MercadoPago.

### POST /api/subscription/webhook-new

Endpoint para recibir webhooks de MercadoPago.

## Componente React

### SubscriptionManager

```tsx
import { SubscriptionManager } from '@/components/subscription/subscription-manager'

<SubscriptionManager 
  storeId="store_123"
  userEmail="usuario@email.com"
/>
```

El componente incluye:
- Lista de planes disponibles
- Estado actual de la suscripción
- Botones para gestionar suscripción (pausar/reanudar/cancelar)
- Información de trial y facturación
- Manejo de errores

## Estados de Suscripción

- `trial`: Período de prueba gratuito
- `active`: Suscripción activa y pagada
- `suspended`: Suscripción pausada
- `past_due`: Pago vencido
- `cancelled`: Suscripción cancelada
- `expired`: Suscripción expirada

## Webhooks

El SDK maneja automáticamente los webhooks de MercadoPago para:

1. **Preaprobaciones**: Cambios en el estado de la suscripción
2. **Pagos**: Procesamiento de pagos mensuales/anuales

### Configuración en MercadoPago

URL del webhook: `https://yourapp.com/api/subscription/webhook-new`

Eventos a suscribirse:
- `preapproval`
- `payment`

## Utilidades

### Validación

```typescript
import { validateSubscriptionParams } from '@/lib/utils/subscription-utils'

const validation = validateSubscriptionParams({
  storeId: 'store_123',
  planId: 'plan_456',
  payerEmail: 'usuario@email.com'
})

if (!validation.isValid) {
  console.log(validation.errors)
}
```

### Formateo

```typescript
import { formatPrice, formatBillingDate } from '@/lib/utils/subscription-utils'

const priceText = formatPrice(36000) // "$36.000"
const dateText = formatBillingDate("2024-01-15") // "15 de enero de 2024"
```

### Estados

```typescript
import { isSubscriptionActive, getTrialDaysLeft } from '@/lib/utils/subscription-utils'

const isActive = isSubscriptionActive('trial', '2024-01-30')
const daysLeft = getTrialDaysLeft('2024-01-30')
```

## Testing

Ejecutar tests del SDK:

```bash
node test-sdk-subscriptions.js
```

Este script verifica:
- Configuración de variables de entorno
- Instanciación del SDK
- Conexión con la base de datos
- Endpoints disponibles

## Manejo de Errores

El SDK incluye manejo robusto de errores:

```typescript
import { handleSubscriptionError } from '@/lib/utils/subscription-utils'

try {
  await subscriptionService.createSubscription(params)
} catch (error) {
  const errorInfo = handleSubscriptionError(error)
  console.log(errorInfo.userMessage) // Mensaje amigable para el usuario
}
```

## Monitoreo y Logs

El SDK incluye logging detallado:

```typescript
// Los logs incluyen:
console.log('[SDK] Creando suscripción...', { storeId, planId })
console.log('[WebHook] Procesando evento:', { type, id })
console.error('[Error] Fallo en MercadoPago:', error)
```

## Seguridad

- Todas las comunicaciones con MercadoPago usan HTTPS
- Los tokens de acceso se manejan como variables de entorno
- Validación de webhooks usando las cabeceras de MercadoPago
- Sanitización de parámetros de entrada

## Limitaciones

- Solo soporta ARS (pesos argentinos) por ahora
- Trial máximo de 30 días (limitación de MercadoPago)
- Una suscripción por tienda
- Requiere MercadoPago Argentina

## Próximas Mejoras

- [ ] Soporte para múltiples monedas
- [ ] Suscripciones con múltiples productos
- [ ] Descuentos y promociones
- [ ] Métricas y analytics
- [ ] Notificaciones por email
- [ ] Panel de administración mejorado

## Soporte

Para dudas o problemas:
1. Revisar los logs en consola
2. Verificar configuración de MercadoPago
3. Consultar documentación de MercadoPago
4. Contactar soporte técnico
