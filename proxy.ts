import { updateSession } from "@/lib/supabase/middleware"
import { confirmationRedirectMiddleware } from "@/lib/middleware/confirmation-redirect"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
  // Verificar redirecciones de confirmación de email primero
  const confirmationResponse = confirmationRedirectMiddleware(request)
  if (confirmationResponse.status === 307 || confirmationResponse.status === 302) {
    return confirmationResponse
  }

  const response = NextResponse.next()

  const origin = request.headers.get("origin")
  const isDevelopment = process.env.NODE_ENV === "development"

  if (
    isDevelopment ||
    (origin &&
      (origin.includes("foodynow.com.ar") ||
        origin.includes("vercel.app") ||
        origin.includes("localhost")))
  ) {
    response.headers.set("Access-Control-Allow-Origin", origin || "*")
    response.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT")
    response.headers.set(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
    )
    response.headers.set("Access-Control-Allow-Credentials", "true")
    response.headers.set("Access-Control-Max-Age", "86400")
  }

  if (request.method === "OPTIONS") {
    const optionsResponse = new Response(null, { status: 200 })
    if (
      isDevelopment ||
      (origin &&
        (origin.includes("foodynow.com.ar") ||
          origin.includes("vercel.app") ||
          origin.includes("localhost")))
    ) {
      optionsResponse.headers.set("Access-Control-Allow-Origin", origin || "*")
      optionsResponse.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT")
      optionsResponse.headers.set(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
      )
      optionsResponse.headers.set("Access-Control-Allow-Credentials", "true")
      optionsResponse.headers.set("Access-Control-Max-Age", "86400")
    }
    return optionsResponse
  }

  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""

  const mainDomains = [
    "foodynow.com.ar",
    "www.foodynow.com.ar",
    "foodynowapp.vercel.app",
    "v0-ecommerce-pwa.vercel.app",
    "localhost:3000",
    "localhost:3001",
  ]

  const excludedPaths = ["/_next", "/api", "/robots.txt", "/favicon.ico", "/offline"]

  if (excludedPaths.some((path) => url.pathname.startsWith(path))) {
    try {
      return await updateSession(request)
    } catch (error) {
      return NextResponse.next()
    }
  }

  const isVercelPreviewDomain = hostname.endsWith(".vercel.app") && hostname.includes("-git-")
  const isMainDomain = mainDomains.some((domain) => hostname === domain) || isVercelPreviewDomain
  const isLocalhost = hostname.includes("localhost") || hostname.startsWith("127.0.0.1")

  if (isLocalhost) {
    try {
      return await updateSession(request)
    } catch (error) {
      return NextResponse.next()
    }
  }

  if (!isMainDomain) {
    let storeSlug = ""

    if (hostname.endsWith(".foodynow.com.ar")) {
      storeSlug = hostname.replace(".foodynow.com.ar", "")
    } else if (hostname.includes("vercel.app")) {
      const parts = hostname.split(".")
      if (parts.length > 2 && !mainDomains.includes(hostname)) {
        storeSlug = parts[0]
      }
    }

    if (storeSlug && storeSlug !== "www" && storeSlug !== "api") {
      const originalPath = url.pathname

      const staticAssetPaths = new Set(["/robots.txt", "/favicon.ico", "/offline"])
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
        staticAssetPaths.has(originalPath) ||
        staticExtensions.some((extension) => originalPath.endsWith(extension))

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
        return response
      }
    }
  }

  if (url.pathname.startsWith("/store/") && isMainDomain && !isLocalhost && !isVercelPreviewDomain) {
    const pathParts = url.pathname.split("/")
    if (pathParts.length >= 3) {
      const storeSlug = pathParts[2]
      const remainingPath = pathParts.slice(3).join("/")

      let newHostname = ""
      if (hostname.includes("foodynow.com.ar")) {
        newHostname = `${storeSlug}.foodynow.com.ar`
      } else if (hostname.includes("vercel.app")) {
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
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|robots\\.txt|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|json|ico|txt|js|css|woff|woff2|ttf|eot)$).*)",
  ],
}
