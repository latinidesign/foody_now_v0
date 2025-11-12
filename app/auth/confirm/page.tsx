"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthHeader } from "@/components/auth/auth-header"

function ConfirmEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = createClient()
      
      try {
        // Los parámetros de confirmación vienen en la URL
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (token_hash && type === 'email') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email'
          })

          if (error) {
            throw error
          }

          setStatus('success')
          setMessage('¡Email confirmado exitosamente!')
          
          // Redirigir a onboarding después de 2 segundos
          setTimeout(() => {
            router.push('/onboarding')
          }, 2000)
        } else {
          throw new Error('Enlace de confirmación inválido')
        }
      } catch (error: any) {
        setStatus('error')
        
        // Detectar diferentes tipos de error
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          setMessage('El enlace de confirmación ha expirado o es inválido. Por favor, solicita un nuevo enlace.')
        } else {
          setMessage(error.message || 'Error confirmando el email')
        }
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <CardTitle className="text-2xl">Confirmando email...</CardTitle>
              <CardDescription>
                Estamos verificando tu confirmación
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
              <CardTitle className="text-2xl">¡Email confirmado!</CardTitle>
              <CardDescription>
                Tu cuenta ha sido verificada exitosamente. Te redirigimos a la página de bienvenida...
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
              <CardTitle className="text-2xl">Error de confirmación</CardTitle>
              <CardDescription>
                Hubo un problema confirmando tu email
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg ${
            status === 'success' ? 'bg-green-50 border border-green-200' :
            status === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-sm ${
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-red-700' :
              'text-blue-700'
            }`}>
              {message}
            </p>
          </div>
          
          {status === 'success' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Serás redirigido automáticamente para continuar con la configuración de tu tienda...
              </p>
              <Button 
                onClick={() => router.push('/auth/sign-up?confirmed=true')}
                className="w-full"
              >
                Continuar ahora
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center space-y-2">
              {message.includes('expirado') ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Los enlaces de confirmación expiran por seguridad. Puedes solicitar un nuevo enlace desde la página de registro.
                  </p>
                  <Button 
                    onClick={() => router.push('/auth/resend-confirmation')}
                    className="w-full"
                  >
                    Solicitar nuevo enlace
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => router.push('/auth/sign-up')}
                    className="w-full"
                  >
                    Volver al registro
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Intentar nuevamente
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmEmailPage() {
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
          <ConfirmEmailContent />
        </Suspense>
      </div>
    </div>
  )
}
