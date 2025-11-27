import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function confirmationRedirectMiddleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  // Solo aplicar en la página principal
  if (url.pathname !== '/') {
    return NextResponse.next()
  }
  
  const error = url.searchParams.get('error')
  const errorCode = url.searchParams.get('error_code')
  
  // Si detectamos parámetros de error de confirmación
  if (error === 'access_denied' && errorCode === 'otp_expired') {
    console.log('🔄 Middleware: Detectado enlace de confirmación expirado')
    
    // Redirigir a la página de corrección
    url.pathname = '/fix-confirmation'
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}
