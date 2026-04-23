"use client"

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getBrowserClient } from "@/lib/supabase/client"

function EmailConfirmationHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const handleConfirmation = async () => {
      // Verificar si hay parámetros de confirmación en la URL
      const error = searchParams.get('error')
      const errorCode = searchParams.get('error_code')
      const errorDescription = searchParams.get('error_description')
      
      // Si hay parámetros de error de confirmación, redirigir a la página de confirmación
      if (error === 'access_denied' && errorCode === 'otp_expired') {
        console.log('🔄 Detectado token expirado, redirigiendo a confirmación...')
        
        // Extraer email del hash si está presente
        const hash = window.location.hash
        const emailMatch = hash.match(/email=([^&]+)/)
        const email = emailMatch ? decodeURIComponent(emailMatch[1]) : null
        
        // Redirigir a página de reenvío de confirmación
        if (email) {
          router.push(`/auth/resend-confirmation?email=${encodeURIComponent(email)}`)
        } else {
          router.push('/auth/resend-confirmation')
        }
        return
      }
      
      // Verificar si hay parámetros de éxito de confirmación
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      
      if ((token && type) || (accessToken && refreshToken)) {
        console.log('🔄 Detectados parámetros de confirmación exitosa...')
        
        try {
          const supabase = getBrowserClient()
          
          // Verificar si hay una sesión activa
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (user && user.email_confirmed_at) {
            console.log('✅ Usuario confirmado exitosamente')
            
            // Mostrar mensaje de éxito y redirigir
            router.push('/auth/confirm?success=true')
            return
          }
          
        } catch (error) {
          console.error('❌ Error verificando confirmación:', error)
        }
      }
    }

    handleConfirmation()
  }, [searchParams, router])

  return null // Este componente no renderiza nada visible
}

export default function EmailConfirmationWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <EmailConfirmationHandler />
      </Suspense>
      {children}
    </>
  )
}
