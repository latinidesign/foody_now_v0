"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LocationMapProps {
  address: string
  storeName: string
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface Coordinates {
  lat: number
  lng: number
}

export function LocationMap({
  address,
  storeName,
  children,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: LocationMapProps) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setIsOpen = externalOnOpenChange || setInternalOpen

  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        }
      }
      return null
    } catch (error) {
      console.error("Error geocoding address:", error)
      return null
    }
  }

  useEffect(() => {
    const handleOpenMap = async () => {
      if (!isOpen) return

      if (!address.trim()) {
        setError("No hay dirección configurada")
        return
      }

      setLoading(true)
      setError("")
      setCoordinates(null)

      const coords = await geocodeAddress(address)
      if (coords) {
        setCoordinates(coords)
      } else {
        setError("No se pudo encontrar la ubicación")
      }
      setLoading(false)
    }

    handleOpenMap()
  }, [isOpen, address])

  const openGoogleMaps = () => {
    if (coordinates) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}&travelmode=driving`
      window.open(googleMapsUrl, "_blank")
    } else {
      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      window.open(searchUrl, "_blank")
    }
  }

  if (children) {
    // Traditional usage with DialogTrigger
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ubicación de {storeName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Dirección:</p>
              <p className="text-sm text-muted-foreground">{address}</p>
            </div>

            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Cargando mapa...</span>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {coordinates && (
              <div className="space-y-4">
                <div className="w-full h-64 rounded-lg overflow-hidden border">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.01},${coordinates.lat - 0.01},${coordinates.lng + 0.01},${coordinates.lat + 0.01}&layer=mapnik&marker=${coordinates.lat},${coordinates.lng}`}
                    title={`Mapa de ${storeName}`}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={openGoogleMaps} className="flex-1">
                    <Navigation className="w-4 h-4 mr-2" />
                    Cómo llegar (Google Maps)
                  </Button>

                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Ubicación de {storeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Dirección:</p>
            <p className="text-sm text-muted-foreground">{address}</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Cargando mapa...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {coordinates && (
            <div className="space-y-4">
              <div className="w-full h-64 rounded-lg overflow-hidden border">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.01},${coordinates.lat - 0.01},${coordinates.lng + 0.01},${coordinates.lat + 0.01}&layer=mapnik&marker=${coordinates.lat},${coordinates.lng}`}
                  title={`Mapa de ${storeName}`}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={openGoogleMaps} className="flex-1">
                  <Navigation className="w-4 h-4 mr-2" />
                  Cómo llegar (Google Maps)
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}&zoom=16`,
                      "_blank",
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver en OpenStreetMap
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
