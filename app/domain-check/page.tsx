import { headers } from "next/headers"

export default async function DomainCheckPage() {
  const headersList = await headers()
  const host = headersList.get("host") || "No host detected"
  const userAgent = headersList.get("user-agent") || "No user agent"

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Verificación de Dominio - FoodyNow</h1>

        <div className="grid gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Información del Dominio</h2>
            <div className="space-y-2">
              <p>
                <strong>Host actual:</strong> {host}
              </p>
              <p>
                <strong>User Agent:</strong> {userAgent}
              </p>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Configuración de Subdominios</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Dominio Principal:</h3>
                <p className="text-sm text-muted-foreground">foodynow.com.ar</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Ejemplo de Subdominio:</h3>
                <p className="text-sm text-muted-foreground">pizzeria-don-mario.foodynow.com.ar</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Estructura de URLs:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• [tienda].foodynow.com.ar → /store/[tienda]</li>
                  <li>• [tienda].foodynow.com.ar/checkout → /store/[tienda]/checkout</li>
                  <li>• [tienda].foodynow.com.ar/order/123 → /store/[tienda]/order/123</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Configuración en Vercel</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Pasos para configurar el dominio:</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Ve a tu proyecto en Vercel Dashboard</li>
                  <li>Navega a Settings → Domains</li>
                  <li>
                    Agrega el dominio: <code className="bg-muted px-1 rounded">foodynow.com.ar</code>
                  </li>
                  <li>
                    Agrega el wildcard: <code className="bg-muted px-1 rounded">*.foodynow.com.ar</code>
                  </li>
                  <li>Configura los registros DNS según las instrucciones de Vercel</li>
                </ol>
              </div>

              <div>
                <h3 className="font-medium mb-2">Registros DNS necesarios:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• A record: foodynow.com.ar → 76.76.19.61</p>
                  <p>• CNAME: *.foodynow.com.ar → cname.vercel-dns.com</p>
                  <p className="text-xs mt-2 italic">Los valores exactos los proporciona Vercel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
