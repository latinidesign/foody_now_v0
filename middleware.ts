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

  // Rutas que nunca deben ser reescritas
  const excludedPaths = ["/_next", "/api", "/manifest.json", "/sw.js", "/robots.txt", "/favicon.ico", "/offline"]

  if (excludedPaths.some((path) => url.pathname.startsWith(path))) {
    try {
      return await updateSession(request)
    } catch (error) {
      return NextResponse.next()
    }
  }

  // Verificar si es un subdominio de tienda
  const isMainDomain = mainDomains.some((domain) => hostname === domain)

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

    if (storeSlug && storeSlug !== "www" && storeSlug !== "api") {
      const originalPath = url.pathname

      const staticAssetPaths = new Set(["/manifest.json", "/sw.js", "/robots.txt", "/favicon.ico", "/offline"])

      const staticExtensions = [
        ".png",
        ".jpg",
        ".jpeg",
        ".svg",
        ".gif",
        ".webp",
        ".webmanifest",
        ".json",
        ".ico",
        ".txt",
        ".js",
        ".css",
        ".woff",
        ".woff2",
        ".ttf",
        ".eot",
      ]

      const isStaticAsset =
        staticAssetPaths.has(originalPath) || staticExtensions.some((extension) => originalPath.endsWith(extension))

      if (isStaticAsset) {
        return NextResponse.next()
      }

      if (originalPath === "/") {
        url.pathname = `/store/${storeSlug}`
      } else {
        url.pathname = `/store/${storeSlug}${originalPath}`
      }

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
        // Si Supabase falla, continuar con el rewrite sin autenticación
        return response
      }
    }
  }

  if (url.pathname.startsWith("/store/") && isMainDomain) {
    const pathParts = url.pathname.split("/")
    if (pathParts.length >= 3) {
      const storeSlug = pathParts[2]
      const remainingPath = pathParts.slice(3).join("/")

      let newHostname = ""
      if (hostname.includes("foodynow.com.ar")) {
        newHostname = `${storeSlug}.foodynow.com.ar`
      } else if (hostname.includes("vercel.app")) {
        // Para Vercel, mantener el formato original pero con subdominio
        const baseDomain = hostname.replace(/^[^.]+\./, "")
        newHostname = `${storeSlug}.${baseDomain}`
      } else {
        newHostname = `${storeSlug}.${hostname}`
      }

      const redirectUrl = new URL(request.url)
      redirectUrl.hostname = newHostname
      redirectUrl.pathname = remainingPath ? `/${remainingPath}` : "/"

      return NextResponse.redirect(redirectUrl, 301)
    }
  }

  try {
    return await updateSession(request)
  } catch (error) {
    // Si updateSession falla, continuar sin autenticación
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
    "/((?!_next/static|_next/image|manifest\\.json|sw\\.js|robots\\.txt|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|json|ico|txt|js|css|woff|woff2|ttf|eot)$).*)",
  ],
}
