"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const galleryImages = images.length > 0 ? images : ["/product-placeholder.png"]

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted group">
        <img
          src={galleryImages[currentImageIndex] || "/placeholder.svg"}
          alt={`${productName} - Imagen ${currentImageIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
          onClick={() => setIsZoomed(true)}
        />

        {/* Zoom Icon */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsZoomed(true)}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        {/* Navigation Arrows */}
        {galleryImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevImage}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextImage}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {currentImageIndex + 1} / {galleryImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {galleryImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                index === currentImageIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <img
                src={image || "/placeholder.svg"}
                alt={`${productName} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
          <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
            <img
              src={galleryImages[currentImageIndex] || "/placeholder.svg"}
              alt={`${productName} - Imagen ${currentImageIndex + 1}`}
              className="w-full h-full object-contain text-[rgba(255,255,255,0.22282608695652173)]"
            />

            {/* Close Button */}
            <Button variant="secondary" size="sm" className="absolute top-4 right-4" onClick={() => setIsZoomed(false)}>
              <X className="w-4 h-4" />
            </Button>

            {/* Navigation in Fullscreen */}
            {galleryImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Fullscreen Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-2 rounded">
                  {currentImageIndex + 1} / {galleryImages.length}
                </div>

                {/* Fullscreen Thumbnails */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                  <div className="flex gap-2 overflow-x-auto max-w-md">
                    {galleryImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`flex-shrink-0 w-12 h-12 rounded border overflow-hidden transition-all ${
                          index === currentImageIndex
                            ? "border-white ring-2 ring-white/50"
                            : "border-white/30 hover:border-white/70"
                        }`}
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`${productName} - Miniatura ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
