"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Copy, Check, Settings, Phone } from "lucide-react"
import { whatsappService } from "@/lib/whatsapp/client"
import { toast } from "sonner"

interface WhatsAppSettingsProps {
  storeId: string
  storeSlug: string
  storeName: string
  currentPhone?: string
  autoNotifications?: boolean
}

export function WhatsAppSettings({
  storeId,
  storeSlug,
  storeName,
  currentPhone,
  autoNotifications: initialAutoNotifications,
}: WhatsAppSettingsProps) {
  const [phone, setPhone] = useState(currentPhone || "")
  const [autoNotifications, setAutoNotifications] = useState(initialAutoNotifications || true)
  const [customMessage, setCustomMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: "",
    authToken: "",
    whatsappNumber: "",
  })

  const storeUrl = `${window.location.origin}/store/${storeSlug}`
  const defaultMessage = whatsappService.generateStoreLinkResponse(storeSlug, storeName)
  const responseMessage = customMessage || defaultMessage

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
    setSaving(true)
    try {
      const response = await fetch(`/api/stores/${storeId}/whatsapp`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsapp_number: phone,
          whatsapp_notifications: autoNotifications,
          whatsapp_message: customMessage,
          twilio_account_sid: twilioConfig.accountSid,
          twilio_auth_token: twilioConfig.authToken,
          twilio_whatsapp_number: twilioConfig.whatsappNumber,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar configuración")
      }

      toast.success("Configuración de WhatsApp guardada correctamente")
    } catch (error) {
      console.error("Error saving WhatsApp settings:", error)
      toast.error("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            Configuración de Twilio (Mensajes Automáticos)
          </CardTitle>
          <CardDescription>
            Configura tu cuenta de Twilio para enviar mensajes automáticos de WhatsApp a tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twilio-account-sid">Account SID de Twilio</Label>
            <Input
              id="twilio-account-sid"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={twilioConfig.accountSid}
              onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilio-auth-token">Auth Token de Twilio</Label>
            <Input
              id="twilio-auth-token"
              type="password"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={twilioConfig.authToken}
              onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilio-whatsapp-number">Número de WhatsApp de Twilio</Label>
            <Input
              id="twilio-whatsapp-number"
              placeholder="+14155238886"
              value={twilioConfig.whatsappNumber}
              onChange={(e) => setTwilioConfig({ ...twilioConfig, whatsappNumber: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Número de WhatsApp Business proporcionado por Twilio para tu tienda
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-500" />
            Número de Contacto de la Tienda
          </CardTitle>
          <CardDescription>Tu número personal de WhatsApp para recibir notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-phone">Número de WhatsApp Personal</Label>
            <Input
              id="whatsapp-phone"
              placeholder="+54 9 11 1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Tu número personal donde recibirás las notificaciones de pedidos
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones automáticas</Label>
              <p className="text-sm text-muted-foreground">Recibe notificaciones automáticas de nuevos pedidos</p>
            </div>
            <Switch checked={autoNotifications} onCheckedChange={setAutoNotifications} />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </CardContent>
      </Card>

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

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensaje automático para clientes</CardTitle>
          <CardDescription>
            Personaliza el mensaje que enviarás cuando los clientes te pidan el link de tu tienda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-message">Mensaje personalizado (opcional)</Label>
            <Textarea
              id="custom-message"
              placeholder="Deja vacío para usar el mensaje automático"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

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
