"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, Settings, Phone } from "lucide-react"
import { whatsappService } from "@/lib/whatsapp/client"
import { toast } from "sonner"

interface WhatsAppSettingsProps {
  storeId: string
  storeSlug: string
  storeName: string
  currentPhone?: string
  autoNotifications?: boolean
  initialMessage?: string
  waPhoneNumberId?: string
  waBusinessAccountId?: string
  waAccessToken?: string
  waDefaultWelcomeTemplate?: string
  waDefaultOrderTemplate?: string
}

export function WhatsAppSettings({
  storeId,
  storeSlug,
  storeName,
  currentPhone,
  autoNotifications: initialAutoNotifications,
  initialMessage,
  waPhoneNumberId,
  waBusinessAccountId,
  waAccessToken,
  waDefaultWelcomeTemplate,
  waDefaultOrderTemplate,
}: WhatsAppSettingsProps) {
  const [phone, setPhone] = useState(currentPhone || "")
  const [autoNotifications, setAutoNotifications] = useState(initialAutoNotifications ?? true)
  const [customMessage, setCustomMessage] = useState(initialMessage || "")
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [phoneNumberId, setPhoneNumberId] = useState(waPhoneNumberId || "")
  const [businessAccountId, setBusinessAccountId] = useState(waBusinessAccountId || "")
  const [accessToken, setAccessToken] = useState(waAccessToken || "")
  const [welcomeTemplate, setWelcomeTemplate] = useState(waDefaultWelcomeTemplate || "")
  const [orderTemplate, setOrderTemplate] = useState(waDefaultOrderTemplate || "")

  const storeUrl = typeof window !== "undefined" ? `${window.location.origin}/store/${storeSlug}` : ""
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
          wa_phone_number_id: phoneNumberId,
          wa_business_account_id: businessAccountId,
          wa_access_token: accessToken,
          wa_default_welcome_template: welcomeTemplate,
          wa_default_order_template: orderTemplate,
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
            Configuración de WhatsApp Cloud API
          </CardTitle>
          <CardDescription>
            Ingresa los datos de tu aplicación de Meta para enviar mensajes automáticos desde la Cloud API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wa-phone-number-id">Phone Number ID</Label>
            <Input
              id="wa-phone-number-id"
              placeholder="123456789012345"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Identificador del número de teléfono habilitado en tu cuenta de WhatsApp Business
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa-business-account-id">Business Account ID</Label>
            <Input
              id="wa-business-account-id"
              placeholder="123456789012345"
              value={businessAccountId}
              onChange={(e) => setBusinessAccountId(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Identificador de tu cuenta de WhatsApp Business en Meta</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa-access-token">Access Token</Label>
            <Input
              id="wa-access-token"
              type="password"
              placeholder="EAAG..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Token de acceso con permisos para enviar mensajes en nombre de tu aplicación
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa-welcome-template">Plantilla de bienvenida por defecto</Label>
            <Input
              id="wa-welcome-template"
              placeholder="store_welcome"
              value={welcomeTemplate}
              onChange={(e) => setWelcomeTemplate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa-order-template">Plantilla de confirmación de pedido</Label>
            <Input
              id="wa-order-template"
              placeholder="order_confirmation"
              value={orderTemplate}
              onChange={(e) => setOrderTemplate(e.target.value)}
            />
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
          <Button
            onClick={() => storeUrl && navigator.clipboard.writeText(storeUrl)}
            variant="outline"
            className="mt-3 w-full"
            disabled={!storeUrl}
          >
          <Copy className="h-4 w-4 mr-2" />
            Copiar link
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
