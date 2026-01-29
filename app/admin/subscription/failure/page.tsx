"use client"
import Link from "next/link"

export default function FailurePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 mt-10">
      <h1 className="text-2xl font-bold text-red-600">Pago no aprobado</h1>
      <p>No se pudo completar tu pago.</p>
      <Link href="/admin/subscription">
        <button className="px-4 py-2 bg-fuchsia-600 text-white rounded hover:bg-fuchsia-700">
          Volver a planes
        </button>
      </Link>
    </div>
  )
}
