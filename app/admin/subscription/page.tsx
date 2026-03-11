
import { createClient } from '@/lib/supabase/server'
import { AlertCircle, Clock, Lock } from 'lucide-react'
import { redirect } from 'next/navigation'
import PlanCard from './PlanCard'
import SubscribeButton from "./SubscribeButton"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccessBlockedBanner } from '@/components/admin/access-blocked-banner'

/* ============================
   Tipos (opcionales pero sanos)
============================ */

type SubscriptionPlan = {
  id: string
  name: string
  description: string
  price: number
  billing_interval: string
  trial_days: number
}

type UserSubscription = {
  id: string
  status: string
  current_period_end: string
  current_period_start: string
  price: number
}

/* ============================
   Page
============================ */

export default async function SubscriptionPage() {
  const supabase = await createClient()

  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  /* Buscar suscripción activa del usuario (trae los datos del plan para mostrarlos) */
  const { data: activeSubscription } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .maybeSingle()

  // Buscar cualquier suscripción anterior (para detectar si fue expirada o cancelada)
  const { data: lastSubscription } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()

  let plan = null
  if (activeSubscription) {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', activeSubscription.plan_name)
      .maybeSingle()
    
    plan = data
  }
  
  console.log("Active subscription:", activeSubscription)
  console.log("Last subscription:", lastSubscription)
  console.log("Subscription plan:", plan)

  /* Si NO tiene suscripción, buscar planes */
  let plans: SubscriptionPlan[] = []

  if (!activeSubscription) {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .is('is_active', true)
      .order('price', { ascending: true })

    plans = data ?? []
  }

  // Determinar el motivo del bloqueo
  const blockReason = lastSubscription ? lastSubscription.status : null

  /* ============================
     Render
  ============================ */

  return (
    <div className="space-y-8">
      {/* Banner de Acceso Bloqueado */}
      <AccessBlockedBanner />

      <header>
        <h1 className="text-2xl font-bold">Suscripción</h1>
        <p className="text-muted-foreground">
          Gestioná tu plan y beneficios
        </p>
      </header>

      {/* ============================
          ALERTA SI ACCESO FUE BLOQUEADO
      ============================ */}
      {!activeSubscription && blockReason && (
        <BlockedAccessAlert reason={blockReason} />
      )}

      {/* ============================
          USUARIO CON SUSCRIPCIÓN
      ============================ */}
      {activeSubscription ? (
        <ActiveSubscriptionView subscription={activeSubscription} plan={plan} user={user} />
      ) : (
        // Se muestran todos los planes disponibles
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mx-8">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================
   Componentes de UI
============================ */
function ActiveSubscriptionView({
  user,
  subscription,
  plan,
}: {
  user: any
  plan: any
  subscription: any
}) {
  const paidEndsAt = new Date(subscription.paid_ends_at)
  const now = new Date()

  const diffMs = paidEndsAt.getTime() - now.getTime()
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const canRenew = daysLeft <= 7

  return (
    <div className="rounded-lg border p-6 space-y-6">
      <h2 className="text-xl font-semibold">
        Tu suscripción activa
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Plan</p>
          <p className="font-medium">
            {plan.display_name}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Precio
          </p>
          <p className="font-medium">
            ${plan.price}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Activo hasta
          </p>
          <p className="font-medium">
            {paidEndsAt.toLocaleDateString()}{" "}
            {paidEndsAt.toLocaleTimeString()}
          </p>

          {!canRenew ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Podrás renovar tu suscripción cuando falten 7 días o menos para el vencimiento.
              <br />
              <span className="font-medium">
                Faltan {daysLeft} días.
              </span>
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-amber-600">
                Tu suscripción vence pronto. Ya podés renovarla para no perder acceso.
              </p>

              <SubscribeButton plan={plan} user={user} text="Renovar suscripción" />
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Estado
          </p>
          <p className="font-medium capitalize">
            {subscription.status}
          </p>
        </div>
      </div>

      <section>
        <h3 className="font-semibold mb-2">
          Beneficios incluidos
        </h3>
        <ul className="space-y-2 text-sm">
          {plan.features.map((feature: string, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✔</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/* ============================
   Componente de Alerta de Bloqueo
============================ */
function BlockedAccessAlert({ reason }: { reason: string }) {
  const getAlertConfig = (status: string) => {
    switch (status) {
      case 'expired':
        return {
          icon: Clock,
          title: '⏰ Período de Prueba Vencido',
          description: 'Tu período de prueba de 14 días ha finalizado. Para continuar usando FoodyNow, necesitas renovar tu suscripción.',
          className: 'bg-orange-50 border-orange-200',
          titleClassName: 'text-orange-900',
          descClassName: 'text-orange-700'
        }
      case 'cancelled':
        return {
          icon: AlertCircle,
          title: '❌ Suscripción Cancelada',
          description: 'Cancelaste tu suscripción. Para volver a usar FoodyNow, puedes renovarla en cualquier momento.',
          className: 'bg-red-50 border-red-200',
          titleClassName: 'text-red-900',
          descClassName: 'text-red-700'
        }
      case 'suspended':
        return {
          icon: Lock,
          title: '🔒 Suscripción Suspendida',
          description: 'Tu suscripción ha sido suspendida por falta de pago. Reactivá tu cuenta renovando tu suscripción.',
          className: 'bg-yellow-50 border-yellow-200',
          titleClassName: 'text-yellow-900',
          descClassName: 'text-yellow-700'
        }
      case 'past_due':
        return {
          icon: AlertCircle,
          title: '⚠️ Pago Pendiente',
          description: 'Tu suscripción tiene un pago vencido. Actualizá tu medio de pago para continuar usando la plataforma.',
          className: 'bg-red-50 border-red-200',
          titleClassName: 'text-red-900',
          descClassName: 'text-red-700'
        }
      default:
        return {
          icon: Lock,
          title: '🔒 Acceso Restringido',
          description: 'Tu suscripción no está activa. Renovála para continuar usando FoodyNow.',
          className: 'bg-gray-50 border-gray-200',
          titleClassName: 'text-gray-900',
          descClassName: 'text-gray-700'
        }
    }
  }

  const config = getAlertConfig(reason)
  const IconComponent = config.icon

  return (
    <div className={`rounded-lg border-2 p-6 ${config.className}`}>
      <div className="flex gap-4">
        <IconComponent className={`w-8 h-8 flex-shrink-0 ${config.titleClassName}`} />
        <div className="flex-1">
          <h3 className={`text-lg font-bold mb-2 ${config.titleClassName}`}>
            {config.title}
          </h3>
          <p className={`text-sm mb-4 ${config.descClassName}`}>
            {config.description}
          </p>
          <p className={`text-xs ${config.descClassName}`}>
            📍 <strong>Nota:</strong> Tu tienda y todos tus datos se mantienen seguros. Al renovar, recuperarás acceso inmediato.
          </p>
        </div>
      </div>
    </div>
  )
}
