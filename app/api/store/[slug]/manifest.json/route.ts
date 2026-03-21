import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    const { data: store, error } = await supabase
      .from("stores")
      .select("id, name, description, logo_url, primary_color, slug")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()

    if (error || !store) {
      return NextResponse.json(
        {
          name: "Foody Now",
          short_name: "FoodyNow",
          description: "Tienda online en FoodyNow",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#2D5016",
          icons: [
            {
              src: "/foodynow_logo-wt.svg",
              sizes: "512x512",
              type: "image/svg+xml",
            },
          ],
        },
        { status: 404 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://foodynow.com.ar"
    const storeUrl = `${baseUrl}/store/${slug}`

    // Usar logo como icono, si no existe usar logo genérico
    const iconUrl = store.logo_url || `${baseUrl}/foodynow_logo-wt.svg`

    const manifest = {
      name: store.name,
      short_name: store.name.substring(0, 12), // Limitar a 12 caracteres
      description: store.description || "Tienda online",
      start_url: storeUrl,
      scope: storeUrl,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: store.primary_color || "#2D5016",
      orientation: "portrait-primary",
      icons: [
        {
          src: iconUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: iconUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: iconUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: iconUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
      screenshots: [
        {
          src: store.logo_url || `${baseUrl}/foodynow_logo-wt.svg`,
          sizes: "540x720",
          type: "image/png",
        },
      ],
      categories: ["shopping", "food"],
      prefer_related_applications: false,
    }

    return NextResponse.json(manifest, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600", // Cache 1 hora
      },
    })
  } catch (error) {
    console.error("[manifest] Error:", error)
    return NextResponse.json(
      {
        name: "Foody Now",
        short_name: "FoodyNow",
        description: "Tienda online",
      },
      { status: 500 }
    )
  }
}
