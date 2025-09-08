"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface StoreSubdomainInfoProps {
  storeSlug: string
  storeName: string
}

export function StoreSubdomainInfo({ storeSlug, storeName }: StoreSubdomainInfoProps) {
  const subdomainUrl = `https://${storeSlug}.foodynow.com.ar`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("URL copiada al portapapeles")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Acceso por Subdominio
          <Badge variant="secondary">Nuevo</Badge>
        </CardTitle>
        <CardDescription>Tu tienda está disponible en su propio subdominio personalizado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">URL de tu tienda:</label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">{subdomainUrl}</code>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(subdomainUrl)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(subdomainUrl, "_blank")}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Ventajas del subdominio:</strong>
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>URL más profesional y fácil de recordar</li>
            <li>Mejor posicionamiento en buscadores (SEO)</li>
            <li>Experiencia de marca más sólida</li>
            <li>Fácil de compartir en redes sociales</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
