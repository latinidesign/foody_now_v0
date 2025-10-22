"use client"

import Link from "next/link"

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-6 py-12 text-center text-green-950">
      <div className="max-w-md space-y-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Sin conexión</h1>
        <p className="text-base leading-relaxed text-green-900/80">
          Parece que no tienes conexión a internet. Puedes seguir explorando la aplicación cuando
          vuelvas a estar en línea.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-full bg-green-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 sm:w-auto"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="w-full rounded-full border border-green-700 px-6 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-700 hover:text-white sm:w-auto"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
