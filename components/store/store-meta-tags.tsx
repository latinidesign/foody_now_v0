import type { Store } from "@/lib/types/database"

interface StoreMetaTagsProps {
  store: Store & { business_hours?: any }
}

export function StoreMetaTags({ store }: StoreMetaTagsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://foodynow.com.ar"
  const storeUrl = `${baseUrl}/store/${store.slug}`
  
  // Usar logo como imagen principal, si no existe usar header_image_url
  const ogImage = store.logo_url || store.header_image_url || `${baseUrl}/foodynow_logo-wt.svg`
  
  // Describir la tienda
  const title = store.name
  const description = store.description || "Tienda online en FoodyNow"

  return (
    <>
      {/* Open Graph Meta Tags para WhatsApp, Facebook, etc. */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={storeUrl} />
      <meta property="og:site_name" content="FoodyNow" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* WhatsApp específico */}
      <meta property="og:locale" content="es_AR" />
    </>
  )
}
