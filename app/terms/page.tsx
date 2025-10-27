import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Términos y Condiciones - FOODYNOW",
  description: "Términos y condiciones de uso de la plataforma FOODYNOW",
}

export default function TermsPage() {
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
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Términos y Condiciones de Uso</h1>
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
                FoodyNow (en adelante, "la Plataforma") es un servicio digital provisto por Latini Design, que permite a
                comercios del rubro alimentario crear y administrar sus propias tiendas online, y a los usuarios
                realizar pedidos de productos y servicios gastronómicos.
              </p>
              <p>
                El acceso, registro y uso de la Plataforma implican la aceptación plena de estos Términos y Condiciones.
              </p>
              <p className="font-semibold">
                Si no está de acuerdo con alguno de los puntos aquí establecidos, deberá abstenerse de utilizar los
                servicios.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Definiciones</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">FoodyNow / Plataforma:</span> el sistema digital,
                  sitio web o aplicación operada por Latini Design.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Comercio / Tienda:</span> el establecimiento o persona
                  jurídica que utiliza FoodyNow para ofrecer sus productos o servicios.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Usuario / Cliente:</span> toda persona que accede a
                  una tienda dentro de FoodyNow para realizar pedidos o compras.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Pedido:</span> la operación de compra y/o contratación
                  de productos o servicios dentro de una tienda.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Objeto del servicio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                FoodyNow provee la infraestructura tecnológica que permite:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>La creación y personalización de tiendas online</li>
                <li>La publicación de productos, precios y promociones</li>
                <li>La gestión de pedidos, pagos y entregas</li>
                <li>La comunicación entre usuarios y comercios</li>
              </ul>
              <p className="text-sm font-semibold mt-4">
                FoodyNow no vende productos ni servicios propios, sino que actúa como intermediario tecnológico entre el
                comercio y el usuario.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Registro y cuentas de usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Para utilizar las funciones de la Plataforma, el usuario o comercio deberá registrarse y proporcionar
                información veraz, completa y actualizada.
              </p>
              <p className="text-sm text-muted-foreground mb-3">Cada cuenta es personal e intransferible.</p>
              <p className="text-sm text-muted-foreground mb-3">
                El titular es responsable del uso, resguardo y confidencialidad de sus credenciales de acceso.
              </p>
              <p className="text-sm text-muted-foreground">
                FoodyNow se reserva el derecho de suspender o eliminar cuentas que incumplan los presentes términos o se
                usen con fines fraudulentos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Responsabilidades de los comercios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Cada comercio es único responsable de:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>La veracidad de la información publicada (productos, precios, promociones)</li>
                <li>La atención, cumplimiento, entrega y facturación de los pedidos recibidos</li>
                <li>El cumplimiento de las normativas sanitarias, fiscales y de defensa del consumidor</li>
                <li>El tratamiento de los datos personales de sus clientes conforme a la legislación vigente</li>
              </ul>
              <p className="text-sm font-semibold mt-4">
                FoodyNow no asume responsabilidad por el incumplimiento de los comercios frente a los usuarios.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Responsabilidades de los usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Los usuarios se comprometen a:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Proporcionar información cierta y actualizada al registrarse o realizar pedidos</li>
                <li>Usar la Plataforma de forma lícita y respetuosa</li>
                <li>No manipular precios, sistemas de pago ni realizar actividades fraudulentas</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                El usuario reconoce que las operaciones realizadas a través de FoodyNow son válidas y vinculantes una
                vez confirmadas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Procesamiento de pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                FoodyNow integra pasarelas de pago seguras (por ejemplo, MercadoPago) para facilitar las transacciones.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Los pagos se procesan directamente por dichas entidades, conforme a sus propias políticas de seguridad y
                privacidad.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                FoodyNow no almacena datos de tarjetas ni medios de pago.
              </p>
              <p className="text-sm text-muted-foreground">
                Cualquier inconveniente con la operación financiera deberá gestionarse directamente con la pasarela
                correspondiente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Precios, disponibilidad y entregas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Los precios, promociones y tiempos de entrega son determinados por cada comercio y pueden variar sin
                previo aviso.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                FoodyNow no garantiza la disponibilidad de los productos ni el cumplimiento de los plazos de entrega.
              </p>
              <p className="text-sm text-muted-foreground">
                Ante reclamos o inconvenientes en la transacción, el usuario deberá contactar primero al comercio
                correspondiente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Propiedad intelectual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Todos los elementos de la Plataforma (software, diseños, logotipos, textos, imágenes, bases de datos,
                etc.) son propiedad de Latini Design o se utilizan bajo licencia, y están protegidos por la legislación
                argentina e internacional sobre propiedad intelectual.
              </p>
              <p className="text-sm text-muted-foreground">
                Queda prohibido copiar, modificar, distribuir o explotar dichos contenidos sin autorización expresa.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Privacidad y protección de datos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                El tratamiento de los datos personales se rige por la Política de Privacidad de FoodyNow, la cual forma
                parte integrante de estos Términos y Condiciones.
              </p>
              <p className="text-sm text-muted-foreground">
                Podés consultarla en:{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  https://foodynow.com.ar/privacy
                </Link>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Limitación de responsabilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                FoodyNow actúa exclusivamente como intermediario tecnológico, por lo que no se responsabiliza por:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Fallos, retrasos o errores en los servicios de los comercios</li>
                <li>Pérdidas económicas, daños o perjuicios derivados de operaciones entre usuario y comercio</li>
                <li>Interrupciones o fallas técnicas ocasionadas por terceros o fuerza mayor</li>
              </ul>
              <p className="text-sm font-semibold mt-4">
                En todos los casos, la responsabilidad de FoodyNow se limita al correcto funcionamiento técnico de la
                Plataforma.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Suspensión o modificación del servicio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                FoodyNow podrá, en cualquier momento y sin previo aviso:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Modificar las funcionalidades de la Plataforma</li>
                <li>Interrumpir temporalmente el servicio por mantenimiento o actualizaciones</li>
                <li>Dar de baja cuentas o contenidos que incumplan los presentes términos o la ley aplicable</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>13. Enlaces externos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                La Plataforma puede contener enlaces a sitios o servicios de terceros.
              </p>
              <p className="text-sm text-muted-foreground">
                FoodyNow no controla ni se responsabiliza por el contenido, políticas o prácticas de dichos sitios
                externos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>14. Comunicaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Toda comunicación oficial relacionada con estos términos deberá realizarse a:{" "}
                <a href="mailto:foodynow.ar@gmail.com" className="text-primary hover:underline">
                  foodynow.ar@gmail.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                FoodyNow podrá enviar notificaciones al correo electrónico registrado por el usuario o comercio.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>15. Jurisdicción y ley aplicable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Estos Términos y Condiciones se rigen por las leyes de la República Argentina.
              </p>
              <p className="text-sm text-muted-foreground">
                Cualquier controversia derivada de su interpretación o cumplimiento será sometida a los tribunales
                ordinarios de la ciudad de Puerto Madryn, Provincia del Chubut, con renuncia expresa a cualquier otro
                fuero o jurisdicción.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>16. Aceptación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Al registrarse o utilizar FoodyNow, el usuario y/o comercio declara haber leído, comprendido y aceptado
                íntegramente estos Términos y Condiciones, los cuales son vinculantes desde el primer uso de la
                Plataforma.
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
