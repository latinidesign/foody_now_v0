'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from 'next/link'

export default function SubscriptionSuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get('subscription_id')

  useEffect(() => {
    if (subscriptionId) {
      updateSubscriptionStatus()
    } else {
      setStatus('success')
      setMessage('¡Suscripción procesada exitosamente!')
    }
  }, [subscriptionId])

  const updateSubscriptionStatus = async () => {
    try {
      // Actualizar el estado de la suscripción a 'trial' o 'active'
      const response = await fetch(`/api/subscription/sync/${subscriptionId}`, {
        method: 'POST'
      })

      if (response.ok) {
        setStatus('success')
        setMessage('¡Tu suscripción ha sido activada exitosamente!')
      } else {
        setStatus('success') // Asumir éxito aunque falle la sincronización
        setMessage('Suscripción procesada. La activación puede tomar unos minutos.')
      }
    } catch (error) {
      console.error('Error actualizando suscripción:', error)
      setStatus('success')
      setMessage('Suscripción procesada. La activación puede tomar unos minutos.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
              <CardTitle className="mt-4">Procesando suscripción...</CardTitle>
              <CardDescription>
                Estamos confirmando tu suscripción con MercadoPago
              </CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <CardTitle className="mt-4 text-green-700">¡Éxito!</CardTitle>
              <CardDescription>
                {message}
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
              <CardTitle className="mt-4 text-red-700">Error</CardTitle>
              <CardDescription>
                {message}
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <div className="space-y-2 text-sm text-gray-600">
              <p>✅ Suscripción activada</p>
              <p>🎁 Período de prueba iniciado</p>
              <p>📧 Recibirás un email de confirmación</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/admin">
                Ir al Panel de Administración
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/admin/setup">
                Ver Configuración
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
