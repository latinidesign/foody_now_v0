// app/subscription/PlanCard.tsx
import SubscribeButton from "./SubscribeButton"

export default function PlanCard({ plan, user }: { plan: any, user: any }) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-pink-200 bg-white shadow-lg mx-2 p-8 text-center">
      <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-pink-100">
        🏪
      </div>

      <h1 className="text-2xl font-bold text-fuchsia-600">
        ¡Bienvenido a FOODYNOW! 🎉
      </h1>

      <p className="mt-2 text-gray-600">
        Activá la suscripción y comenzá a disfrutar de todas las características
        premium.
      </p>

      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <h2 className="font-semibold text-emerald-800">
          {plan.display_name}
        </h2>

        <p className="mt-2 text-3xl font-bold text-emerald-700">
          ${plan.price.toLocaleString("es-AR")}
        </p>

        <p className="text-sm text-emerald-700 mt-4">
          {plan.description}
        </p>
      </div>

      <ul className="mt-6 space-y-3 text-left">
        {plan.features.map((feature: string, i: number) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-green-500">✔</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <div className="mt-6 rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
            <strong>Importante:</strong>
            <br />
            Al finalizar la prueba gratuita o el período facturado, tu tienda quedará desactivada hasta
            activar una suscripción paga.
        </div>

        <div className="mt-6">
            <SubscribeButton plan={plan} user={user} />
        </div>
      </div>
    </div>
  )
}
