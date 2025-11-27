"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthHeader } from "@/components/auth/auth-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

function ConfirmationFixerContent() {
  const [status, setStatus] = useState<'loading' | 'input' | 'processing' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkStatus = async () => {
      const error = searchParams.get('error')
      const errorCode = searchParams.get('error_code')
      const errorDescription = searchParams.get('error_description')
      
      console.log('🔍 Parámetros de error:', { error, errorCode, errorDescription })
      
      if (error === 'access_denied' && errorCode === 'otp_expired') {
        setStatus('input')
        setMessage('Tu enlace de confirmación ha expirado. Ingresa tu email para recibir uno nuevo.')
      } else if (errorDescription) {
        setStatus('error')
        setMessage(`Error de confirmación: ${decodeURIComponent(errorDescription)}`)
      } else {
        setStatus('input')
        setMessage('Parece que hubo un problema con tu confirmación de email. Ingresa tu email para solucionarlo.')
      }
    }

    checkStatus()
  }, [searchParams])

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Por favor ingresa tu email")
      return
    }

    setStatus('processing')
    const supabase = createClient()
    
    try {
      // Intentar reenviar confirmación
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
      
      setStatus('success')
      setMessage('¡Nuevo email de confirmación enviado! Revisa tu bandeja de entrada.')
      toast.success("Email enviado exitosamente")
      
    } catch (error: any) {
      console.error('❌ Error enviando confirmación:', error)
      
      // Si el error es que el usuario ya está confirmado
      if (error.message?.includes('already') || error.message?.includes('confirmed')) {
        setStatus('success')
        setMessage('Tu cuenta ya está confirmada. Puedes iniciar sesión normalmente.')
      } else {
        setStatus('error')
        setMessage(`Error: ${error.message || 'No se pudo enviar el email de confirmación'}`)
        toast.error("Error enviando email")
      }
    }
  }

  if (status === 'loading') {
    return (
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <CardTitle className="text-2xl">Verificando...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          {status === 'processing' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <CardTitle className="text-2xl">Enviando email...</CardTitle>
              <CardDescription>
                Generando nuevo enlace de confirmación
              </CardDescription>
            </>
          )}
          
          {status === 'input' && (
            <>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Enlace expirado</CardTitle>
              <CardDescription>
                Necesitas un nuevo enlace de confirmación
              </CardDescription>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl">¡Listo!</CardTitle>
              <CardDescription>
                Email de confirmación enviado
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Error</CardTitle>
              <CardDescription>
                Hubo un problema procesando tu solicitud
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg ${
            status === 'success' ? 'bg-green-50 border border-green-200' :
            status === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-orange-50 border border-orange-200'
          }`}>
            <p className={`text-sm ${
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-red-700' :
              'text-orange-700'
            }`}>
              {message}
            </p>
          </div>
          
          {status === 'input' && (
            <form onSubmit={handleResendConfirmation} className="space-y-4">
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
              
              <Button type="submit" className="w-full">
                Enviar nuevo enlace
              </Button>
            </form>
          )}
          
          {status === 'success' && (
            <div className="text-center space-y-2">
              <Button 
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Ir a iniciar sesión
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Revisa tu bandeja de entrada y spam
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center space-y-2">
              <Button 
                onClick={() => setStatus('input')}
                className="w-full"
              >
                Intentar nuevamente
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push('/auth/sign-up')}
                className="w-full"
              >
                Volver al registro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmationFixerPage() {
  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      
      <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-4 md:p-6">
        <Suspense fallback={
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <CardTitle className="text-2xl">Cargando...</CardTitle>
              </CardHeader>
            </Card>
          </div>
        }>
          <ConfirmationFixerContent />
        </Suspense>
      </div>
    </div>
  )
}
