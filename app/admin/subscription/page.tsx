
import { createClient } from '@/lib/supabase/server'

import { redirect } from 'next/navigation'
import PlanCard from './PlanCard'

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
  plan: SubscriptionPlan
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

  /* Buscar suscripción activa del usuario */
  const { data: activeSubscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  
  console.log("Active subscription:", activeSubscription)

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

  /* ============================
     Render
  ============================ */

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Suscripción</h1>
        <p className="text-muted-foreground">
          Gestioná tu plan y beneficios
        </p>
      </header>

      {/* ============================
          USUARIO CON SUSCRIPCIÓN
      ============================ */}
      {activeSubscription ? (
        <ActiveSubscriptionView subscription={activeSubscription} />
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
  subscription,
}: {
  subscription: any
}) {
  return (
    <div className="rounded-lg border p-6 space-y-6">
      <h2 className="text-xl font-semibold">
        Tu suscripción activa
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Plan</p>
          <p className="font-medium">
            {subscription.plan_name}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Precio
          </p>
          <p className="font-medium">
            ${subscription.price}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Activo hasta
          </p>
          <p className="font-medium">
            {new Date(
              subscription.paid_ends_at
            ).toLocaleDateString()} {new Date(
              subscription.paid_ends_at
            ).toLocaleTimeString()}
          </p>
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
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Beneficio 1 (placeholder)</li>
          <li>Beneficio 2 (placeholder)</li>
          <li>Beneficio 3 (placeholder)</li>
        </ul>
      </section>
    </div>
  )
}
