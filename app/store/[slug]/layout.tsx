import { createClient } from "@/lib/supabase/server"
import { ReactNode } from "react"

interface StoreLayoutProps {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { slug } = await params
  const supabase = await createClient().catch(() => null)

  let store = null
  if (supabase) {
    const { data } = await supabase
      .from("stores")
      .select("name, logo_url, primary_color")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()
    store = data
  }

  const storeName = store?.name || "Tienda"
  const logoUrl = store?.logo_url
  const themeColor = store?.primary_color || "#2D5016"

  return (
    <>
      <head>
        {/* Apple Icons */}
        {logoUrl && (
          <>
            <link rel="apple-touch-icon" href={logoUrl} />
            <link rel="apple-touch-icon-precomposed" href={logoUrl} />
            <link rel="icon" type="image/png" href={logoUrl} />
          </>
        )}
      </head>
      {children}
    </>
  )
}
