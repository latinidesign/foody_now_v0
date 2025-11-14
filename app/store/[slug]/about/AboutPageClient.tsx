"use client"

import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { StoreHeader } from "@/components/store/store-header"
import { ArrowLeft, MapPin, Clock, Phone } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BusinessHoursModal } from "@/components/store/business-hours-modal"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { combineStorePath, deriveStoreBasePathFromPathname } from "@/lib/store/path"

interface AboutPageProps {
  params: { slug: string }
}

export default function AboutPageClient({ params }: AboutPageProps) {
  const { slug } = params
  const [supabase, setSupabase] = useState<any>(null)
  const [storeWithHours, setStoreWithHours] = useState<any>(null)
  const [demoMode, setDemoMode] = useState<boolean>(false)
  const pathname = usePathname()
  const storeBasePath = deriveStoreBasePathFromPathname(pathname, slug)
  const storeHomeHref = combineStorePath(storeBasePath)  

  useState(() => {
    const fetchData = async () => {
      const supabaseInstance = await createClient()
      if (!supabaseInstance) {
        setDemoMode(true)
        return
      }
      setSupabase(supabaseInstance)

      const { data: store, error: storeError } = await supabaseInstance
        .from("stores")
        .select(`
          *,
          store_settings!inner(business_hours)
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .single()

      if (storeError || !store) {
        notFound()
      }

      const storeWithHours = {
        ...store,
        business_hours: store.store_settings?.[0]?.business_hours,
      }
      setStoreWithHours(storeWithHours)
    }

    fetchData()
  })

  const BusinessHoursSection = ({ store }: { store: any }) => {
    const [showHours, setShowHours] = useState(false)

    return (
      <>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary" />
          <button onClick={() => setShowHours(true)} className="text-primary hover:underline">
            Consultar horarios de atención
          </button>
        </div>

        <BusinessHoursModal
          businessHours={store.business_hours}
          storeName={store.name}
          open={showHours}
          onOpenChange={setShowHours}
        />
      </>
    )
  }

  if (demoMode) {
    const demoStore = {
      id: "demo-store",
      name: "Tienda Demo",
      slug: slug,
      description: "Tienda de demostración",
      extended_description:
        "Esta es una descripción ampliada de demostración. Aquí puedes contar la historia de tu negocio, tu visión, valores y todo lo que hace especial a tu tienda.",
      gallery_images: ["/local1.jpg", "/local2.jpg"],
      logo_url: null,
      banner_url: null,
      address: "Dirección de demostración",
      phone: "+54 11 1234-5678",
      primary_color: "#2D5016",
      is_active: true,
    }

    return (
      <div className="min-h-screen bg-background">
        <StoreHeader store={demoStore} />
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <Link href={storeHomeHref}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a la tienda
              </Button>
            </Link>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Modo Demostración</h3>
            <p className="text-yellow-700 text-sm">
              Esta página está en modo demostración. Configura Supabase para ver datos reales.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">Quiénes Somos</h1>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Nuestra Historia</h2>
                <p className="text-muted-foreground leading-relaxed">{demoStore.extended_description}</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Información de Contacto</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{demoStore.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span>{demoStore.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>Lun - Dom: 11:00 - 23:00</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-6">Nuestro Local</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoStore.gallery_images.map((image, index) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Foto del local ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!storeWithHours) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader store={storeWithHours} />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href={storeHomeHref}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la tienda
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Quiénes Somos</h1>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Nuestra Historia</h2>
              {storeWithHours.extended_description ? (
                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {storeWithHours.extended_description}
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  La información ampliada de esta tienda aún no ha sido configurada.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Información de Contacto</h2>
              <div className="space-y-3">
                {storeWithHours.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{storeWithHours.address}</span>
                  </div>
                )}
                {storeWithHours.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span>{storeWithHours.phone}</span>
                  </div>
                )}
                <BusinessHoursSection store={storeWithHours} />
              </div>
            </div>
          </div>

          {storeWithHours.gallery_images && storeWithHours.gallery_images.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Nuestro Local</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storeWithHours.gallery_images.map((image: string, index: number) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Foto del local ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
