"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { MessageCircle, Copy, Check } from "lucide-react"
import { whatsappService } from "@/lib/whatsapp/client"

interface WhatsAppSettingsProps {
  storeSlug: string
  storeName: string
  currentPhone?: string
}

export function WhatsAppSettings({ storeSlug, storeName, currentPhone }: WhatsAppSettingsProps) {
  const [phone, setPhone] = useState(currentPhone || "")
  const [autoNotifications, setAutoNotifications] = useState(true)
  const [copied, setCopied] = useState(false)

  const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeSlug}`
  const responseMessage = whatsappService.generateStoreLinkResponse(storeSlug, storeName)

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(decodeURIComponent(responseMessage))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  const handleSave = async () => {
    // Here you would save the WhatsApp settings to the database
    console.log("Saving WhatsApp settings:", { phone, autoNotifications })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Configuración de WhatsApp
          </CardTitle>
          <CardDescription>Configura tu número de WhatsApp para recibir notificaciones de pedidos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-phone">Número de WhatsApp</Label>
            <Input
              id="whatsapp-phone"
              placeholder="+54 9 11 1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Incluye el código de país (ej: +54 para Argentina)</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones automáticas</Label>
              <p className="text-sm text-muted-foreground">Recibe notificaciones automáticas de nuevos pedidos</p>
            </div>
            <Switch checked={autoNotifications} onCheckedChange={setAutoNotifications} />
          </div>

          <Button onClick={handleSave} className="w-full">
            Guardar configuración
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensaje automático para clientes</CardTitle>
          <CardDescription>
            Copia este mensaje para responder cuando los clientes te pidan el link de tu tienda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm whitespace-pre-line">{decodeURIComponent(responseMessage)}</p>
          </div>
          <Button onClick={handleCopyMessage} variant="outline" className="mt-3 w-full bg-transparent">
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar mensaje
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link directo de tu tienda</CardTitle>
          <CardDescription>Comparte este link directamente con tus clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-mono break-all">{storeUrl}</p>
          </div>
          <Button onClick={() => navigator.clipboard.writeText(storeUrl)} variant="outline" className="mt-3 w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copiar link
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
