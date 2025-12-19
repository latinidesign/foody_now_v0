import { AlertCircle, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface StoreSuspendedMessageProps {
  storeName: string
  whatsappPhone?: string
}

export function StoreSuspendedMessage({ storeName, whatsappPhone }: StoreSuspendedMessageProps) {
  const formattedPhone = whatsappPhone?.replace(/\D/g, '')
  const whatsappLink = formattedPhone 
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Hola, quisiera consultar sobre la tienda ${storeName}`)}`
    : null

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Tienda Temporalmente Suspendida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            La tienda <strong>{storeName}</strong> se encuentra temporalmente suspendida.
          </p>
          
          {whatsappLink && (
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Para más información, comunicate por WhatsApp:
              </p>
              <Button asChild variant="default" className="w-full" size="lg">
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contactar por WhatsApp
                </a>
              </Button>
            </div>
          )}

          <div className="pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              Si eres el propietario de esta tienda, 
              <a href="/admin" className="text-primary hover:underline ml-1">
                inicia sesión aquí
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
