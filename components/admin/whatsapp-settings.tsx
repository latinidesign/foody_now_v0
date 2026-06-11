"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, Phone, Send, ExternalLink, RotateCcw, Save } from "lucide-react"
import { whatsappService } from "@/lib/whatsapp/client"
import { toast } from "sonner"
import { ORDER_STATUSES, ORDER_STATUS_LABELS, DEFAULT_MESSAGES } from "@/lib/whatsapp/default-messages"
import type { OrderStatus } from "@/lib/whatsapp/default-messages"

interface WhatsAppSettingsProps {
  storeId: string
  storeSlug: string
  storeName: string
  currentPhone?: string
  autoNotifications?: boolean
  initialMessage?: string
  orderStatusMessages?: Record<string, string>
}

export function WhatsAppSettings({
  storeId,
  storeSlug,
  storeName,
  currentPhone,
  autoNotifications: initialAutoNotifications,
  initialMessage,
  orderStatusMessages: initialStatusMessages,
}: WhatsAppSettingsProps) {
  const [phone, setPhone] = useState(currentPhone || "")
  const [autoNotifications, setAutoNotifications] = useState(initialAutoNotifications ?? true)
  const [customMessage, setCustomMessage] = useState(initialMessage || "")
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testLink, setTestLink] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  const [statusMessages, setStatusMessages] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const s of ORDER_STATUSES) {
      initial[s] = initialStatusMessages?.[s] ?? ""
    }
    return initial
  })

  const storeUrl = `https://${storeSlug}.foodynow.com.ar`
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
      // Filtrar vacíos y armar objeto final
      const finalStatusMessages: Record<string, string> = {}
      for (const s of ORDER_STATUSES) {
        if (statusMessages[s]?.trim()) {
          finalStatusMessages[s] = statusMessages[s].trim()
        }
      }

      const response = await fetch(`/api/stores/${storeId}/whatsapp`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsapp_number: phone,
          whatsapp_notifications: autoNotifications,
          whatsapp_message: customMessage,
          order_status_messages: Object.keys(finalStatusMessages).length > 0 ? finalStatusMessages : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar configuración")
      }

      toast.success("Configuración guardada correctamente")
    } catch (error) {
      console.error("Error saving WhatsApp settings:", error)
      toast.error("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestMessage = async () => {
    setTesting(true)
    setTestLink(null)
    setTestError(null)

    try {
      const payload: Record<string, unknown> = {}
      if (phone) {
        payload.to = phone
      }

      const response = await fetch(`/api/stores/${storeId}/whatsapp/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data?.error || "No se pudo enviar el mensaje de prueba"
        setTestError(errorMessage)
        setTestLink(data?.fallbackLink ?? null)
        toast.error(errorMessage)
        return
      }

      if (data.success) {
        toast.success("Mensaje de prueba enviado correctamente")
        setTestLink(null)
        setTestError(null)
      } else {
        const errorMessage = data?.error || "No se pudo enviar el mensaje de prueba"
        setTestError(errorMessage)
        setTestLink(data?.fallbackLink ?? null)
        toast.warning(errorMessage)
        if (data?.fallbackLink) {
          toast.info("Generamos un enlace alternativo para que pruebes la integración manualmente")
        }
      }
    } catch (error) {
      console.error("Error sending WhatsApp test message:", error)
      setTestError("Ocurrió un error inesperado al enviar el mensaje de prueba")
      toast.error("Ocurrió un error inesperado al enviar el mensaje de prueba")
    } finally {
      setTesting(false)
    }
  }

  const handleCopyTestLink = async () => {
    if (!testLink) return
    try {
      await navigator.clipboard.writeText(testLink)
      toast.success("Link de prueba copiado al portapapeles")
    } catch (error) {
      console.error("Error copying test link:", error)
      toast.error("No se pudo copiar el link")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mensajes por estado del pedido</CardTitle>
          <CardDescription>
            Personalizá los mensajes que se envían a los clientes cuando cambia el estado de su pedido.
            Dejá un campo vacío para usar el mensaje por defecto.
            Podés usar las variables: <code className="text-xs bg-muted px-1 rounded">{`{customer_name}`}</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">{`{order_number}`}</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">{`{store_name}`}</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">{`{items}`}</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">{`{total}`}</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">{`{delivery_address}`}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {ORDER_STATUSES.map((status) => (
            <div key={status} className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">{ORDER_STATUS_LABELS[status]}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setStatusMessages((prev) => ({
                      ...prev,
                      [status]: "",
                    }))
                  }
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Restablecer
                </Button>
              </div>
              <Textarea
                value={statusMessages[status]}
                onChange={(e) =>
                  setStatusMessages((prev) => ({
                    ...prev,
                    [status]: e.target.value,
                  }))
                }
                placeholder={`Usar mensaje por defecto`}
                rows={4}
                className="text-sm"
              />
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">Vista previa del mensaje por defecto</summary>
                <div className="mt-2 bg-muted p-3 rounded whitespace-pre-wrap">
                  {DEFAULT_MESSAGES[status]}
                </div>
              </details>
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar todos los mensajes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Número de teléfono y notificaciones</CardTitle>
          <CardDescription>
            Configurá el número desde el cual te contactarán los clientes y las notificaciones automáticas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de WhatsApp</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 5491123456789"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Número donde los clientes pueden contactarte. Incluí código de país.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-notifications">Notificaciones automáticas</Label>
              <p className="text-sm text-muted-foreground">
                Enviar automáticamente mensajes de WhatsApp al cambiar el estado del pedido.
              </p>
            </div>
            <Switch
              id="auto-notifications"
              checked={autoNotifications}
              onCheckedChange={setAutoNotifications}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Probar conexión</CardTitle>
          <CardDescription>
            Enviá un mensaje de prueba a tu número para verificar que la configuración funciona.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSendTestMessage} disabled={testing} variant="outline">
            <Send className="h-4 w-4 mr-2" />
            {testing ? "Enviando..." : "Enviar mensaje de prueba"}
          </Button>

          {testError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {testError}
            </div>
          )}

          {testLink && (
            <div className="flex gap-2">
              <Input value={testLink} readOnly className="text-xs" />
              <Button onClick={handleCopyTestLink} variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
              <a href={testLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensaje para clientes (compartir tienda)</CardTitle>
          <CardDescription>
            Utilizá este mensaje o personalizalo, para compartir el acceso a la tienda cuando los clientes te pidan el menú.
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
