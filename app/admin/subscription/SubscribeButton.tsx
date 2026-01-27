// app/subscription/SubscribeButton.tsx
"use client"

export default function SubscribeButton({ plan, user }: { plan: any, user: any }) {
  const handleSubscribe = async () => {
    console.log("Iniciar suscripción para plan:", plan.name)

    const res = await fetch("/api/mp/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: plan, user: user })
    })

    const data = await res.json()

    if (data.init_point) {
      window.location.href = data.init_point
    } else {
      console.error("Error al crear la preferencia de pago:", data)
    }

  }

  return (
    <button
      onClick={handleSubscribe}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-fuchsia-600 py-3 text-white font-semibold hover:bg-fuchsia-700 transition"
    >
      💳 Suscribirme
      <span>→</span>
    </button>
  )
}
