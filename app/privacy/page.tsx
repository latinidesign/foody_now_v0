import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Política de Privacidad - FOODYNOW",
  description: "Política de privacidad y protección de datos personales de FOODYNOW",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/foodynow_logo-wt.svg"
                alt="FOODYNOW"
                width={100}
                height={45}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Política de Privacidad</h1>
            <p className="text-lg text-muted-foreground">Última actualización: 25 de octubre de 2025</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Introducción</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                FoodyNow (en adelante, "la Plataforma"), propiedad de Latini Design, es un sistema de tiendas online
                multicomercio destinado al sector gastronómico y alimentario. A través de FoodyNow, los usuarios pueden
                acceder a los catálogos de productos, realizar pedidos, efectuar pagos y comunicarse con los comercios
                adheridos.
              </p>
              <p>
                La presente Política de Privacidad describe cómo recolectamos, utilizamos, almacenamos y protegemos los
                datos personales de usuarios y comercios que utilizan la Plataforma.
              </p>
              <p>
                Al acceder o usar FoodyNow, el usuario o comercio declara haber leído y aceptado los términos de esta
                política.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Datos que recolectamos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">A. De los usuarios (clientes finales):</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Nombre y apellido</li>
                  <li>Dirección, teléfono y correo electrónico</li>
                  <li>Datos de ubicación y preferencias de compra</li>
                  <li>
                    Información de pago y facturación (gestionada mediante pasarelas seguras como MercadoPago u otras)
                  </li>
                  <li>Historial de pedidos y navegación dentro de la tienda</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">B. De los comercios (titulares de tiendas FoodyNow):</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Razón social, CUIT y domicilio comercial</li>
                  <li>Nombre del responsable o administrador de la tienda</li>
                  <li>Datos de contacto (teléfono, correo, redes sociales)</li>
                  <li>Imágenes, logotipos, productos y precios publicados</li>
                  <li>Información bancaria o de cobro para la liquidación de ventas</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">C. Datos técnicos y analíticos:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Dirección IP, tipo de dispositivo, navegador y sistema operativo</li>
                  <li>Cookies y tecnologías de rastreo para fines estadísticos, de seguridad y mejora del servicio</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Finalidad del tratamiento de los datos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Los datos se utilizan para:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Permitir el registro, autenticación y gestión de cuentas</li>
                <li>Facilitar transacciones entre usuarios y comercios</li>
                <li>Brindar soporte técnico y atención al cliente</li>
                <li>Personalizar la experiencia del usuario dentro de la tienda</li>
                <li>Enviar notificaciones sobre el estado del pedido, promociones o actualizaciones</li>
                <li>Cumplir con obligaciones legales, impositivas y regulatorias</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Base legal del tratamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">El tratamiento de datos personales se basa en:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>El consentimiento informado otorgado por el titular de los datos</li>
                <li>La ejecución de una relación contractual entre FoodyNow, el comercio y/o el usuario</li>
                <li>El cumplimiento de obligaciones legales y fiscales</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Comunicación y transferencia de datos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                FoodyNow podrá compartir datos personales únicamente con:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Comercios adheridos, en lo estrictamente necesario para gestionar pedidos</li>
                <li>Proveedores de servicios (hosting, pagos, mensajería, marketing, soporte técnico)</li>
                <li>Autoridades competentes, cuando la ley lo requiera</li>
              </ul>
              <p className="text-sm font-semibold mt-4">
                En ningún caso FoodyNow vende ni comercializa datos personales a terceros.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Seguridad y almacenamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                FoodyNow implementa medidas técnicas y organizativas para proteger la información frente a accesos no
                autorizados, pérdida o alteración, incluyendo:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Conexiones seguras (HTTPS)</li>
                <li>Cifrado de contraseñas y datos sensibles</li>
                <li>Control de accesos y auditorías periódicas</li>
                <li>
                  Almacenamiento en servidores con estándares de seguridad equivalentes al nivel internacional (por
                  ejemplo, Vercel y Supabase)
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Derechos de los titulares de datos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                De acuerdo con la Ley N° 25.326, los titulares podrán:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
                <li>Acceder a sus datos personales</li>
                <li>Solicitar su actualización, rectificación o eliminación</li>
                <li>Revocar el consentimiento otorgado</li>
                <li>Solicitar información sobre el uso de sus datos</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Para ejercer estos derechos, deberán comunicarse a:{" "}
                <a href="mailto:foodynow.ar@gmail.com" className="text-primary hover:underline">
                  foodynow.ar@gmail.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                La Agencia de Acceso a la Información Pública (AAIP) es el órgano de control de la Ley 25.326.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Conservación de los datos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Los datos se conservarán durante:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>El tiempo que dure la relación contractual o de uso de la Plataforma</li>
                <li>El plazo necesario para cumplir obligaciones legales o resolver disputas</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                Luego de ese tiempo, los datos serán eliminados o anonimizados.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Uso de cookies y tecnologías similares</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">FoodyNow utiliza cookies para:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Recordar preferencias de usuario</li>
                <li>Medir estadísticas de uso y rendimiento</li>
                <li>Mejorar la experiencia de navegación</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                El usuario puede configurar su navegador para rechazar cookies, aunque algunas funciones podrían verse
                afectadas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Comunicaciones y notificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                FoodyNow podrá enviar mensajes informativos o promocionales a los correos registrados. El usuario podrá
                desuscribirse en cualquier momento siguiendo el enlace incluido en cada comunicación.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Modificaciones a esta política</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                FoodyNow podrá actualizar esta Política de Privacidad en cualquier momento. Las modificaciones serán
                publicadas en la plataforma con la fecha de última actualización.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Para consultas sobre esta política o el tratamiento de datos personales:
              </p>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-semibold">Email:</span>{" "}
                  <a href="mailto:foodynow.ar@gmail.com" className="text-primary hover:underline">
                    foodynow.ar@gmail.com
                  </a>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Web:</span>{" "}
                  <a href="https://foodynow.com.ar" className="text-primary hover:underline">
                    https://foodynow.com.ar
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>Anexo: Comercios dentro del ecosistema FoodyNow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Cada comercio que utilice la Plataforma es responsable del tratamiento de los datos de sus propios
                clientes en el marco de las ventas y comunicaciones que realice, debiendo cumplir con:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Las políticas de privacidad y protección de datos personales aplicables en su jurisdicción</li>
                <li>La obligación de mantener la confidencialidad de la información recibida a través de FoodyNow</li>
                <li>
                  No utilizar los datos de los usuarios para fines distintos a los previstos (gestión de pedidos,
                  atención postventa, comunicación comercial legítima)
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                FoodyNow actúa como prestador tecnológico y encargado del tratamiento, garantizando que los datos se
                procesan conforme a la legislación vigente.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image src="/foodynow_logo-wt.svg" alt="FOODYNOW" width={120} height={50} className="h-12 w-auto" />
            </div>
            <p className="text-muted-foreground mb-6">
              La plataforma moderna para comercialización eficiente en el segmento alimentario
            </p>
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-primary">
                Términos de Servicio
              </Link>
              <Link href="/privacy" className="hover:text-primary">
                Política de Privacidad
              </Link>
              <Link href="mailto:foodynow.ar@gmail.com" className="hover:text-primary">
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
