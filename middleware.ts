import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  console.log("[v0] Middleware ejecutándose para:", request.nextUrl.href)

  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""

  console.log("[v0] Hostname detectado:", hostname)

  // Lista de dominios principales que no son tiendas
  const mainDomains = [
    "foodynow.com.ar",
    "www.foodynow.com.ar",
    "foodynowapp.vercel.app",
    "v0-ecommerce-pwa.vercel.app",
    "localhost:3000",
  ]

  // Verificar si es un subdominio de tienda
  const isMainDomain = mainDomains.some((domain) => hostname === domain)

  console.log("[v0] Es dominio principal:", isMainDomain)

  // Detectar subdominios de tienda
  if (!isMainDomain) {
    let storeSlug = ""

    if (hostname.endsWith(".foodynow.com.ar")) {
      storeSlug = hostname.replace(".foodynow.com.ar", "")
    } else if (hostname.includes("vercel.app")) {
      // Para dominios de Vercel con subdominios
      const parts = hostname.split(".")
      if (parts.length > 2 && !mainDomains.includes(hostname)) {
        storeSlug = parts[0]
      }
    }

    console.log("[v0] Store slug detectado:", storeSlug)

    if (storeSlug && storeSlug !== "www") {
      const originalPath = url.pathname

      if (originalPath === "/") {
        url.pathname = `/store/${storeSlug}`
      } else {
        url.pathname = `/store/${storeSlug}${originalPath}`
      }

      console.log("[v0] Reescribiendo a:", url.pathname)

      const response = NextResponse.rewrite(url)

      try {
        const supabaseResponse = await updateSession(request)

        if (supabaseResponse.cookies) {
          supabaseResponse.cookies.getAll().forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value, cookie)
          })
        }

        return response
      } catch (error) {
        console.log("[v0] Error en updateSession:", error)
        return response
      }
    }
  }

  if (url.pathname.startsWith("/store/") && isMainDomain) {
    const pathParts = url.pathname.split("/")
    if (pathParts.length >= 3) {
      const storeSlug = pathParts[2]
      const remainingPath = pathParts.slice(3).join("/")

      console.log("[v0] Redirigiendo store slug:", storeSlug, "path:", remainingPath)

      let newHostname = ""
      if (hostname.includes("foodynow.com.ar")) {
        newHostname = `${storeSlug}.foodynow.com.ar`
      } else if (hostname.includes("vercel.app")) {
        // Para Vercel, mantener el formato original pero con subdominio
        newHostname = `${storeSlug}-${hostname}`
      } else {
        newHostname = `${storeSlug}.${hostname}`
      }

      const redirectUrl = new URL(request.url)
      redirectUrl.hostname = newHostname
      redirectUrl.pathname = remainingPath ? `/${remainingPath}` : "/"

      console.log("[v0] Redirigiendo a:", redirectUrl.href)

      return NextResponse.redirect(redirectUrl, 301)
    }
  }

  try {
    return await updateSession(request)
  } catch (error) {
    console.log("[v0] Error en updateSession para dominio principal:", error)
    return NextResponse.next()
  }
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
