'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Check, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SubscriptionPlansPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storeInfo, setStoreInfo] = useState<{ storeId: string; email: string } | null>(null)

  useEffect(() => {
    loadStoreInfo()
  }, [])

  const loadStoreInfo = async () => {
    try {
      const supabase = createClient()
      
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Obtener tienda del usuario
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!store) {
        setError('No se encontró tu tienda')
        return
      }

      setStoreInfo({
        storeId: store.id,
        email: user.email || ''
      })
    } catch (err) {
      console.error('Error loading store:', err)
      setError('Error al cargar información de la tienda')
    }
  }

  const handleSubscribe = async () => {
    if (!storeInfo) {
      setError('No se pudo obtener información de la tienda')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeInfo.storeId,
          planId: 'basic_monthly', // Cambiado de 'monthly' a 'basic_monthly'
          payerEmail: storeInfo.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear suscripción')
      }

      if (data.success && data.init_point) {
        // Log para debugging
        console.log('✅ Suscripción creada:', {
          plan_type: data.plan_type,
          trial_days: data.trial_days,
          has_used_trial: data.has_used_trial
        })

        // Redirigir a MercadoPago
        window.location.href = data.init_point
      } else {
        throw new Error('No se obtuvo URL de pago')
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error al procesar la suscripción')
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Suscripción FoodyNow</h1>
        <p className="text-muted-foreground">
          Accedé a todas las funcionalidades de FoodyNow
        </p>
      </div>
      
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
        
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-2xl">Plan Mensual</CardTitle>
          </div>
          <CardDescription>
            Todo lo que necesitás para gestionar tu negocio
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold">$36.000</span>
            <span className="text-muted-foreground">/ mes</span>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Incluye:</h3>
            <ul className="space-y-2">
              {[
                'Gestión de pedidos ilimitados',
                'WhatsApp Business integrado',
                'Pagos con MercadoPago',
                'Panel de administración completo',
                'Catálogo de productos personalizado',
                'Notificaciones en tiempo real',
                'Soporte prioritario',
                'Actualizaciones automáticas'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button 
            onClick={handleSubscribe} 
            className="w-full h-12 text-lg"
            disabled={loading || !storeInfo}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Procesando...
              </>
            ) : (
              'Suscribirme Ahora'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            * El plan se seleccionará automáticamente según tu historial de suscripciones
          </p>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Procesado de forma segura por{' '}
              <span className="font-semibold">MercadoPago</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
        >
          ← Volver
        </Button>
      </div>
    </div>
  )
}
