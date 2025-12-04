"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Clock, CheckCircle, AlertCircle, XCircle, Sparkles } from "lucide-react"
import Link from "next/link"

interface SubscriptionData {
  hasSubscription: boolean
  isInTrial?: boolean
  trialDaysLeft?: number
  trialEndDate?: string
  status: string
  subscription?: {
    id: string
    status: string
    plan_id: string
    price: number
    currency: string
    created_at: string
    next_payment_date?: string
    auto_renewal: boolean
  }
}

export function SubscriptionStatus() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/get-status')
      if (!response.ok) {
        throw new Error('Error obteniendo estado de suscripción')
      }
      const data = await response.json()
      setSubscriptionData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'Pendiente de pago',
          color: 'bg-yellow-100 text-yellow-800',
          description: 'Tu suscripción está pendiente de confirmación de pago'
        }
      case 'trial':
        return {
          icon: <Sparkles className="w-5 h-5" />,
          label: 'Trial Gratuito',
          color: 'bg-blue-100 text-blue-800',
          description: 'Estás en tu período de prueba gratuito'
        }
      case 'active':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Activa',
          color: 'bg-green-100 text-green-800',
          description: 'Tu suscripción está activa y al día'
        }
      case 'past_due':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'Pago vencido',
          color: 'bg-orange-100 text-orange-800',
          description: 'Tu suscripción tiene un pago pendiente vencido'
        }
      case 'suspended':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'Suspendida',
          color: 'bg-yellow-100 text-yellow-800',
          description: 'Tu suscripción está suspendida por falta de pago'
        }
      case 'cancelled':
        return {
          icon: <XCircle className="w-5 h-5" />,
          label: 'Cancelada',
          color: 'bg-red-100 text-red-800',
          description: 'Tu suscripción ha sido cancelada'
        }
      case 'expired':
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'Expirada',
          color: 'bg-gray-100 text-gray-800',
          description: 'Tu período de prueba ha expirado'
        }
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'Pendiente',
          color: 'bg-gray-100 text-gray-800',
          description: 'Estado pendiente'
        }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Estado de Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Estado de Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchSubscriptionStatus} className="mt-4" variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscriptionData) return null

  const statusInfo = getStatusInfo(subscriptionData.status)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Estado de Suscripción
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado actual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <div>
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {statusInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Información específica del estado */}
        {subscriptionData.isInTrial && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Trial Gratuito</h4>
            <p className="text-sm text-blue-700">
              Te quedan <strong>{subscriptionData.trialDaysLeft} días</strong> de prueba gratuita.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Vence el: {subscriptionData.trialEndDate ? new Date(subscriptionData.trialEndDate).toLocaleDateString('es-ES') : 'N/A'}
            </p>
          </div>
        )}

        {subscriptionData.hasSubscription && subscriptionData.subscription && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Plan</p>
                <p className="text-muted-foreground capitalize">{subscriptionData.subscription.plan_id}</p>
              </div>
              <div>
                <p className="font-medium">Precio</p>
                <p className="text-muted-foreground">
                  ${subscriptionData.subscription.price.toLocaleString()} {subscriptionData.subscription.currency}
                </p>
              </div>
              <div>
                <p className="font-medium">Renovación automática</p>
                <p className="text-muted-foreground">
                  {subscriptionData.subscription.auto_renewal ? 'Activada' : 'Desactivada'}
                </p>
              </div>
              <div>
                <p className="font-medium">Desde</p>
                <p className="text-muted-foreground">
                  {new Date(subscriptionData.subscription.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>

            {subscriptionData.subscription.next_payment_date && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Próximo pago:</strong> {new Date(subscriptionData.subscription.next_payment_date).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="pt-4 space-y-2">
          {subscriptionData.status === 'expired' && (
            <Link href="/admin/setup" className="w-full">
              <Button className="w-full">
                Suscribirse Ahora
              </Button>
            </Link>
          )}
          
          {subscriptionData.status === 'suspended' && (
            <Link href="/admin/setup" className="w-full">
              <Button className="w-full" variant="outline">
                Reactivar Suscripción
              </Button>
            </Link>
          )}
          
          {(subscriptionData.status === 'trial' || subscriptionData.isInTrial) && (
            <Link href="/admin/setup" className="w-full">
              <Button className="w-full">
                Convertir a Premium
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
