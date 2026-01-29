"use client"

import { useState } from "react"

export default function PendingPage() {
  const [status, setStatus] = useState("pending")

  const checkStatus = async () => {
    const res = await fetch("/api/subscription/status")
    const data = await res.json()
    setStatus(data.status)
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 mt-10">
      <h1 className="text-2xl font-semibold">Tu pago está en espera</h1>
      <p>Esto puede tardar unos minutos según el método de pago.</p>
      <button
        onClick={checkStatus}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Actualizar estado
      </button>
      <p className="text-sm text-gray-500">Estado: {status === "pending" ? "Pendiente..." : status === "active" ? "Activa" : "Rechazada. Puedes intentar nuevamente con otro medio de pago."}</p>
    </div>
  )
}
