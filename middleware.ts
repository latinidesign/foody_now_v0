import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""

  // Check if it's a subdomain (not www, admin, api, or the main domain)
  const isSubdomain =
    hostname.includes(".") &&
    !hostname.startsWith("www.") &&
    !hostname.startsWith("admin.") &&
    !hostname.startsWith("api.") &&
    hostname !== "foodynow.com.ar" &&
    hostname !== "localhost:3000"

  if (isSubdomain) {
    // Extract subdomain (store slug)
    const subdomain = hostname.split(".")[0]

    // Rewrite subdomain requests to /store/[slug] structure
    if (url.pathname === "/") {
      url.pathname = `/store/${subdomain}`
    } else if (!url.pathname.startsWith("/store/")) {
      url.pathname = `/store/${subdomain}${url.pathname}`
    }

    return NextResponse.rewrite(url)
  }

  // Continue with Supabase auth middleware for non-subdomain requests
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
