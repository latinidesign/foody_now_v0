"use client"

import { MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { whatsappService } from "@/lib/whatsapp/client"

interface WhatsAppContactProps {
  storeSlug: string
  storePhone: string
  storeName: string
}

export function WhatsAppContact({ storeSlug, storePhone, storeName }: WhatsAppContactProps) {
  const handleWhatsAppContact = () => {
    const link = whatsappService.generateStoreLink(storeSlug, storePhone)
    window.open(link, "_blank")
  }

  const handlePhoneCall = () => {
    window.open(`tel:${storePhone}`, "_self")
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      <Button
        onClick={handleWhatsAppContact}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <Button
        onClick={handlePhoneCall}
        variant="outline"
        className="bg-white border-2 border-primary rounded-full p-3 shadow-lg"
        size="icon"
      >
        <Phone className="h-6 w-6" />
      </Button>
    </div>
  )
}
