// Helper para manejar URLs de redirect según el entorno
export function getConfirmationRedirectURL(): string {
  // En desarrollo, usar localhost
  if (typeof window !== 'undefined') {
    // Cliente: usar window.location.origin
    return `${window.location.origin}/auth/confirm`
  }
  
  // Servidor: usar variables de entorno
  const isDevelopment = process.env.NODE_ENV === 'development'
  const baseUrl = isDevelopment 
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_APP_URL || 'https://foodynow.com.ar'
    
  return `${baseUrl}/auth/confirm`
}

export function getBaseURL(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  const isDevelopment = process.env.NODE_ENV === 'development'
  return isDevelopment 
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_APP_URL || 'https://foodynow.com.ar'
}
