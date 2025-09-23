import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""

  // Lista de dominios principales que no son tiendas
  const mainDomains = [
    "foodynow.com.ar",
    "www.foodynow.com.ar",
    "foodynowapp.vercel.app",
    "v0-ecommerce-pwa.vercel.app",
    "localhost:3000",
  ]

  // Verificar si es un subdominio de tienda
  const isMainDomain = mainDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))

  if (!isMainDomain && (hostname.endsWith(".foodynow.com.ar") || hostname.includes("vercel.app"))) {
    // Extraer el slug de la tienda del subdominio
    let storeSlug = ""

    if (hostname.endsWith(".foodynow.com.ar")) {
      storeSlug = hostname.replace(".foodynow.com.ar", "")
    } else if (hostname.includes("vercel.app")) {
      // Para dominios de Vercel, extraer el slug del subdominio
      const parts = hostname.split(".")
      if (parts.length > 2) {
        storeSlug = parts[0]
      }
    }

    if (storeSlug && storeSlug !== "www") {
      // Reescribir la URL internamente a /store/[slug]
      if (url.pathname === "/") {
        url.pathname = `/store/${storeSlug}`
      } else {
        url.pathname = `/store/${storeSlug}${url.pathname}`
      }

      // Reescribir la request internamente
      const rewriteResponse = NextResponse.rewrite(url)

      // Aplicar la lógica de autenticación de Supabase
      const supabaseResponse = await updateSession(request)

      // Combinar las cookies de Supabase con la respuesta de rewrite
      rewriteResponse.cookies.setAll(supabaseResponse.cookies.getAll())

      return rewriteResponse
    }
  }

  if (url.pathname.startsWith("/store/") && isMainDomain) {
    const pathParts = url.pathname.split("/")
    if (pathParts.length >= 3) {
      const storeSlug = pathParts[2]
      const remainingPath = pathParts.slice(3).join("/")

      // Construir la nueva URL con subdominio
      let newHostname = ""
      if (hostname.includes("foodynow.com.ar")) {
        newHostname = `${storeSlug}.foodynow.com.ar`
      } else if (hostname.includes("vercel.app")) {
        newHostname = `${storeSlug}-${hostname}`
      } else {
        newHostname = `${storeSlug}.${hostname}`
      }

      const redirectUrl = new URL(request.url)
      redirectUrl.hostname = newHostname
      redirectUrl.pathname = remainingPath ? `/${remainingPath}` : "/"

      return NextResponse.redirect(redirectUrl, 301)
    }
  }

  // Aplicar la lógica normal de autenticación de Supabase
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
