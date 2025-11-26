"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthHeader } from "@/components/auth/auth-header"

function ConfirmContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const processConfirmation = async () => {
      console.log('🔍 Procesando confirmación de email...')
      
      try {
        const supabase = createClient()
        
        // Verificar si ya hay una sesión activa
        const { data: { user }, error: sessionError } = await supabase.auth.getUser()
        
        if (user && user.email_confirmed_at) {
          console.log('✅ Usuario ya confirmado y logueado')
          setStatus('success')
          setMessage('¡Tu cuenta ya está confirmada y activa!')
          
          setTimeout(() => {
            router.push('/admin')
          }, 2000)
          return
        }
        
        // Mostrar información sobre el proceso
        setStatus('success')
        setMessage('Tu email ha sido confirmado exitosamente. Ya puedes iniciar sesión.')
        
        console.log('✅ Confirmación procesada exitosamente')
        
      } catch (error: any) {
        console.error('❌ Error procesando confirmación:', error)
        setStatus('error')
        setMessage('Hubo un problema procesando la confirmación. Tu cuenta puede estar ya activada.')
      }
    }

    processConfirmation()
  }, [router])

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <CardTitle className="text-2xl">Procesando confirmación...</CardTitle>
              <CardDescription>
                Verificando el estado de tu cuenta
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
                Tu cuenta ha sido verificada exitosamente
              </CardDescription>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Información</CardTitle>
              <CardDescription>
                Estado de tu cuenta
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg ${
            status === 'success' ? 'bg-green-50 border border-green-200' :
            status === 'error' ? 'bg-orange-50 border border-orange-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-sm ${
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-orange-700' :
              'text-blue-700'
            }`}>
              {message}
            </p>
          </div>
          
          <div className="text-center space-y-2">
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Iniciar sesión
            </Button>
            
            <p className="text-xs text-muted-foreground">
              ¿Problemas? <button 
                onClick={() => router.push('/auth/resend-confirmation')}
                className="text-primary underline"
              >
                Solicitar nuevo enlace
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmPage() {
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
          <ConfirmContent />
        </Suspense>
      </div>
    </div>
  )
}
