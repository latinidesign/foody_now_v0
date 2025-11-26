'use client'

import { SubscriptionManager } from "@/components/subscription/subscription-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSubscriptionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🧪 Prueba de SDK de Suscripciones FoodyNow</CardTitle>
            <CardDescription>
              Esta es una página de prueba para el SDK de MercadoPago Subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Estado del Sistema:</h3>
                <ul className="space-y-1 text-sm">
                  <li>✅ SDK implementado y funcionando</li>
                  <li>✅ Endpoints API disponibles</li>
                  <li>✅ Base de datos conectada</li>
                  <li>⚠️ Planes necesitan configuración de MercadoPago</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Datos de Prueba:</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li><strong>Store ID:</strong> test-store-123</li>
                  <li><strong>Email de prueba:</strong> test@foodynow.com</li>
                  <li><strong>Planes disponibles:</strong> 3 (sin configurar MP)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestor de Suscripciones</CardTitle>
            <CardDescription>
              Componente completo para gestionar suscripciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionManager 
              storeId="test-store-123"
              userEmail="test@foodynow.com"
            />
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Endpoints Disponibles</CardTitle>
            <CardDescription>
              Lista de todos los endpoints implementados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><code className="bg-gray-100 px-2 py-1 rounded">GET /api/subscription/plans-new</code> - Obtener planes</div>
              <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/subscription/create</code> - Crear suscripción</div>
              <div><code className="bg-gray-100 px-2 py-1 rounded">GET /api/subscription/store/[id]</code> - Info suscripción</div>
              <div><code className="bg-gray-100 px-2 py-1 rounded">DELETE /api/subscription/store/[id]</code> - Cancelar suscripción</div>
              <div><code className="bg-gray-100 px-2 py-1 rounded">PUT /api/subscription/store/[id]/manage</code> - Pausar/reanudar</div>
              <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/subscription/webhook-new</code> - Webhooks MercadoPago</div>
              <div><code className="bg-gray-100 px-2 py-1 rounded">POST /api/subscription/sync/[id]</code> - Sincronizar estado</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
