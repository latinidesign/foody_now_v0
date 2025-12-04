'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Check, AlertCircle } from "lucide-react"
import { SubscriptionPlan, Subscription } from "@/lib/types/subscription"

interface SubscriptionManagerProps {
  storeId: string
  userEmail: string
}

export function SubscriptionManager({ storeId, userEmail }: SubscriptionManagerProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [storeId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar planes y suscripción actual en paralelo
      const [plansResponse, subscriptionResponse] = await Promise.all([
        fetch('/api/subscription/plans-new'),
        fetch(`/api/subscription/store/${storeId}`)
      ])

      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setPlans(plansData.plans || [])
      }

      if (subscriptionResponse.ok) {
        const subData = await subscriptionResponse.json()
        setCurrentSubscription(subData.subscription)
      }

    } catch (error) {
      console.error('Error cargando datos:', error)
      setError('Error cargando información de suscripciones')
    } finally {
      setLoading(false)
    }
  }

  const createSubscription = async (planId: string) => {
    try {
      setCreating(true)
      setError(null)

      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId,
          planId,
          payerEmail: userEmail
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error creando suscripción')
      }

      // Redirigir a MercadoPago para completar el pago
      if (result.init_point) {
        window.location.href = result.init_point
      } else {
        throw new Error('No se recibió el link de pago')
      }

    } catch (error: any) {
      console.error('Error creando suscripción:', error)
      setError(error.message || 'Error creando suscripción')
    } finally {
      setCreating(false)
    }
  }

  const cancelSubscription = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/subscription/store/${storeId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error cancelando suscripción')
      }

      await loadData() // Recargar datos

    } catch (error: any) {
      console.error('Error cancelando suscripción:', error)
      setError(error.message || 'Error cancelando suscripción')
    } finally {
      setLoading(false)
    }
  }

  const manageSubscription = async (action: 'pause' | 'resume') => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/subscription/store/${storeId}/manage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error ${action === 'pause' ? 'pausando' : 'reanudando'} suscripción`)
      }

      await loadData() // Recargar datos

    } catch (error: any) {
      console.error('Error gestionando suscripción:', error)
      setError(error.message || 'Error gestionando suscripción')
    } finally {
      setLoading(false)
    }
  }

  const syncSubscription = async () => {
    if (!currentSubscription) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/subscription/sync/${currentSubscription.id}`, {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error sincronizando suscripción')
      }

      await loadData() // Recargar datos

    } catch (error: any) {
      console.error('Error sincronizando suscripción:', error)
      setError(error.message || 'Error sincronizando suscripción')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      trial: { label: 'Período de prueba', variant: 'secondary' as const },
      pending: { label: 'Pendiente de pago', variant: 'outline' as const },
      active: { label: 'Activa - Pago al día', variant: 'default' as const },
      suspended: { label: 'Pausada', variant: 'secondary' as const },
      past_due: { label: 'Suspendida - Pago vencido', variant: 'destructive' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
      expired: { label: 'Expirada', variant: 'destructive' as const }
    }

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading && !currentSubscription) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suscripción actual */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Suscripción Actual
              {getStatusBadge(currentSubscription.status)}
            </CardTitle>
            <CardDescription>
              {currentSubscription.plan?.display_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mensaje especial para estado pending */}
            {currentSubscription.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-yellow-800 font-medium">
                  El pago no se concretó. Revisa tu correo electrónico para instrucciones de MercadoPago y vuelve a intentar la suscripción.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Plan</label>
                <p className="text-lg font-semibold">{currentSubscription.plan?.display_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Precio</label>
                <p className="text-lg font-semibold">
                  {formatPrice(currentSubscription.plan?.price || 0)} / {currentSubscription.plan?.billing_frequency === 'monthly' ? 'mes' : 'año'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <p className="text-lg">{getStatusBadge(currentSubscription.status)}</p>
              </div>
            </div>

            {currentSubscription.trial_ends_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">Trial termina</label>
                <p>{new Date(currentSubscription.trial_ends_at).toLocaleDateString()}</p>
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={syncSubscription}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sincronizar'}
              </Button>

              {currentSubscription.status === 'active' && (
                <Button 
                  variant="outline" 
                  onClick={() => manageSubscription('pause')}
                  disabled={loading}
                >
                  Pausar
                </Button>
              )}

              {currentSubscription.status === 'past_due' && (
                <Button 
                  variant="outline" 
                  onClick={() => manageSubscription('resume')}
                  disabled={loading}
                >
                  Reanudar
                </Button>
              )}

              {['trial', 'active', 'past_due'].includes(currentSubscription.status) && (
                <Button 
                  variant="destructive" 
                  onClick={cancelSubscription}
                  disabled={loading}
                >
                  Cancelar Suscripción
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planes disponibles: mostrar también si la suscripción está en estado pending */}
      {(!currentSubscription || ['cancelled', 'expired', 'pending'].includes(currentSubscription.status)) && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Planes Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <CardTitle>{plan.display_name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      /{plan.billing_frequency === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.trial_period_days > 0 && (
                    <Badge variant="secondary">
                      {plan.trial_period_days} días gratis
                    </Badge>
                  )}

                  <ul className="space-y-2">
                    {plan.features?.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => createSubscription(plan.id)}
                    disabled={creating}
                    className="w-full"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Suscribirse
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
