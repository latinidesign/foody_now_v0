"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthHeader } from "@/components/auth/auth-header"
import { toast } from "sonner"
import Link from 'next/link'

export default function ResendConfirmationPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Por favor ingresa tu email")
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        }
      })
      
      if (error) {
        throw error
      }
      
      setEmailSent(true)
      toast.success("Nuevo email de confirmación enviado")
    } catch (error: any) {
      toast.error(error.message || "Error enviando email")
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background">
        <AuthHeader />
        
        <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">¡Email enviado!</CardTitle>
                <CardDescription>
                  Hemos enviado un nuevo enlace de confirmación a <strong>{email}</strong>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📧 Revisa tu bandeja de entrada</h4>
                  <p className="text-sm text-blue-700">
                    Haz clic en el enlace de confirmación en el nuevo email. 
                    Si no lo ves, revisa tu carpeta de spam.
                  </p>
                </div>
                
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Solicitar otro enlace
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      
      <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Enlace de confirmación expirado</CardTitle>
              <CardDescription>
                Los enlaces de confirmación expiran por seguridad. Ingresa tu email para recibir un nuevo enlace.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleResend} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar nuevo enlace"}
                </Button>
              </form>
              
              <div className="mt-4 text-center text-sm">
                ¿No tienes cuenta?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4 text-primary">
                  Crear cuenta
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
