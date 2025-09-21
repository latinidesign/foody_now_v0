// middleware.ts
import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // usar nextUrl.hostname (no trae puerto)
  const url = request.nextUrl.clone()
  const hostname = request.nextUrl.hostname // más fiable que request.headers.get('host')
  const rootDomain = "foodynow.com.ar"

  // si hostname es un subdominio de foodynow.com.ar y no es 'www' ni el root
  if (
    hostname.endsWith(`.${rootDomain}`) && // ej: tienda.foodynow.com.ar
    hostname !== rootDomain &&
    !hostname.startsWith("www.")
  ) {
    // extraer solo la primera parte como slug (tienda.foo.bar -> 'tienda')
    const subdomain = hostname.split(".")[0]

    // si path raíz del subdominio -> rewrite a /store/[slug]
    if (url.pathname === "/") {
      url.pathname = `/store/${subdomain}`
      return NextResponse.rewrite(url)
    }

    // si la ruta no empieza con /store -> prefixarla
    if (!url.pathname.startsWith(`/store/`)) {
      url.pathname = `/store/${subdomain}${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // Si alguien accede a foodynow.com.ar/store/[slug], redirigir al subdominio
  if (hostname === rootDomain && url.pathname.startsWith("/store/")) {
    const parts = url.pathname.split("/")
    if (parts.length >= 3 && parts[2]) {
      const storeSlug = parts[2]
      const remaining = parts.slice(3).join("/")
      const dest = new URL(request.url)
      dest.hostname = `${storeSlug}.${rootDomain}`
      dest.pathname = remaining ? `/${remaining}` : "/"
      return NextResponse.redirect(dest, 301)
    }
  }

  // continuar autenticación de Supabase
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
