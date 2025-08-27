"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  if (!supabase) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Foody Now</CardTitle>
          <CardDescription>Configuración requerida</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-6 bg-muted rounded-lg">
            <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Supabase no configurado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para usar la autenticación, necesitas configurar las variables de entorno de Supabase.
            </p>
            <div className="text-left bg-background p-3 rounded border text-xs font-mono">
              <div>NEXT_PUBLIC_SUPABASE_URL</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Configura estas variables en Project Settings para habilitar la autenticación.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/admin")
        router.refresh()
      }
    } catch (err) {
      setError("Error inesperado. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Foody Now</CardTitle>
        <CardDescription>Ingresa a tu panel de administración</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Sesión
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
