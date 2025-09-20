import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""

  // Verificar si es un subdominio de foodynow.com.ar
  if (hostname.includes("foodynow.com.ar") && !hostname.startsWith("www.") && hostname !== "foodynow.com.ar") {
    // Extraer el slug del subdominio
    const storeSlug = hostname.split(".")[0]

    // Si la URL es la raíz del subdominio, redirigir a /store/[slug]
    if (url.pathname === "/") {
      url.pathname = `/store/${storeSlug}`
      return NextResponse.rewrite(url)
    }

    // Si la URL ya no empieza con /store, agregar el prefijo
    if (!url.pathname.startsWith("/store/")) {
      url.pathname = `/store/${storeSlug}${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // Si alguien accede a foodynow.com.ar/store/[slug], redirigir al subdominio
  if (hostname === "foodynow.com.ar" && url.pathname.startsWith("/store/")) {
    const pathParts = url.pathname.split("/")
    if (pathParts.length >= 3 && pathParts[2]) {
      const storeSlug = pathParts[2]
      const remainingPath = pathParts.slice(3).join("/")
      const newUrl = new URL(request.url)
      newUrl.hostname = `${storeSlug}.foodynow.com.ar`
      newUrl.pathname = remainingPath ? `/${remainingPath}` : "/"
      return NextResponse.redirect(newUrl, 301)
    }
  }

  // Continuar con la autenticación de Supabase
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
