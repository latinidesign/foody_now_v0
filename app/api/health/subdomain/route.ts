import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const hostname = request.headers.get("host") || ""
  const slug = url.searchParams.get("slug")

  // Detectar slug desde hostname si no se proporciona
  let detectedSlug = slug
  if (!detectedSlug) {
    if (hostname.endsWith(".foodynow.com.ar")) {
      detectedSlug = hostname.replace(".foodynow.com.ar", "")
    } else if (hostname.includes("vercel.app")) {
      const parts = hostname.split(".")
      if (parts.length > 2) {
        detectedSlug = parts[0]
      }
    }
  }

  const response = {
    timestamp: new Date().toISOString(),
    hostname,
    detectedSlug,
    providedSlug: slug,
    environment: process.env.NODE_ENV,
    checks: {
      middleware: {
        status: "unknown",
        message: "Middleware detection requires actual routing",
      },
      database: {
        status: "checking",
        message: "Connecting to Supabase...",
      },
      store: {
        status: "pending",
        message: "Store validation pending database connection",
      },
    },
  }

  try {
    const supabase = await createClient()

    if (!supabase) {
      response.checks.database = {
        status: "error",
        message: "Supabase client not available - check environment variables",
      }
      response.checks.store = {
        status: "skipped",
        message: "Store check skipped due to database unavailability",
      }

      return NextResponse.json(response, { status: 503 })
    }

    // Test database connection
    const { data: healthCheck, error: healthError } = await supabase.from("stores").select("count").limit(1)

    if (healthError) {
      response.checks.database = {
        status: "error",
        message: `Database error: ${healthError.message}`,
      }
      response.checks.store = {
        status: "skipped",
        message: "Store check skipped due to database error",
      }

      return NextResponse.json(response, { status: 503 })
    }

    response.checks.database = {
      status: "ok",
      message: "Database connection successful",
    }

    // Test store if slug is available
    if (detectedSlug && detectedSlug !== "www" && detectedSlug !== "api") {
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("id, name, slug, is_active")
        .eq("slug", detectedSlug)
        .eq("is_active", true)
        .single()

      if (storeError || !store) {
        response.checks.store = {
          status: "not_found",
          message: `Store '${detectedSlug}' not found or inactive`,
          suggestion: "Check if the store exists and is active in the database",
        }

        return NextResponse.json(response, { status: 404 })
      }

      response.checks.store = {
        status: "ok",
        message: `Store '${store.name}' found and active`,
        storeData: {
          id: store.id,
          name: store.name,
          slug: store.slug,
        },
      }
    } else {
      response.checks.store = {
        status: "skipped",
        message: "No valid store slug detected",
      }
    }

    const overallStatus = Object.values(response.checks).every(
      (check) => check.status === "ok" || check.status === "skipped",
    )
      ? 200
      : 207 // 207 Multi-Status for partial success

    return NextResponse.json(response, { status: overallStatus })
  } catch (error) {
    response.checks.database = {
      status: "error",
      message: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
    }

    return NextResponse.json(response, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      message: "Use GET method for health checks",
      usage: {
        basic: "GET /api/health/subdomain",
        with_slug: "GET /api/health/subdomain?slug=pizzeria-don-mario",
        from_subdomain: "GET https://pizzeria-don-mario.foodynow.com.ar/api/health/subdomain",
      },
    },
    { status: 405 },
  )
}
