"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SuccessPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"pending" | "active" | "expired">("pending")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/subscription/status")
      const json = await res.json()

      setStatus(json.status)
      setLoading(false)

      if (json.status === "active") {
        clearInterval(interval)
        router.push("/admin")
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 mt-10">
      <h1 className="text-3xl font-bold text-green-600">¡Gracias por tu pago!</h1>
      {loading ? (
        <p className="text-gray-600">Confirmando estado de tu suscripción…</p>
      ) : (
        <p className="text-gray-600">Estado actual: {status}</p>
      )}
    </div>
  )
}
