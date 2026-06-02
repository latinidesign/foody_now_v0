import Link from "next/link"
import ScrollToTop from '@/components/admin/ScrollToTop.tsx'

const sections = [
  {
    id: "guia-inicio",
    title: "Guía de configuración de la tienda",
    description:
      "Completa estos pasos para dejar tu tienda lista para recibir pedidos. Sigue el orden sugerido y revisa cada sección para asegurarte de que todo está configurado.",
  },
  {
    id: "info-general",
    title: "Info General",
    description:
      "En esta sección podés ver un panorama de tu negocio: últimos pedidos, accesos directos y estadísticas breves.",
  },
  {
    id: "productos",
    title: "Productos",
    description:
      "Crea y gestiona el catálogo con fotos, precios y disponibilidad. Puedes habilitar o pausar productos en cualquier momento.",
  },
  {
    id: "categorias",
    title: "Categorías",
    description:
      "Agrupa tus productos para que tus clientes naveguen más rápido. Usa un orden lógico y descripciones cortas.",
  },
  {
    id: "pedidos",
    title: "Pedidos",
    description:
      "Administra el flujo de compra: recibe, confirma, prepara y entrega. Cada pedido muestra el canal y el estado actual.",
  },
  {
    id: "estadisticas",
    title: "Estadísticas",
    description:
      "Consulta métricas de ventas, tickets promedio y productos más vendidos para optimizar tu oferta.",
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description:
      "Personaliza mensajes para WhatsApp que incluyan el link a tu tienda.",
  },
  {
    id: "configuracion",
    title: "Configuración",
    description:
      "Administra la información fiscal, métodos de pago y reglas personalizadas de la tienda.",
  },
]

export default function AdminHelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <header className="space-y-4">
        <p className="text-base font-semibold text-primary uppercase tracking-wide">Centro de ayuda</p>
        <h1 className="text-3xl font-bold tracking-tight">Configura tu Tienda paso a paso</h1>
        <p className="text-muted-foreground">
          Esta guía está pensada para vos como dueño de la tienda. Recorre cada sección del panel de administración y descubre consejos prácticos para activar tu tienda y vender sin complicaciones.
        </p>
        
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Checklist de Inicio rápido</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Completa los datos de la tienda en la sección <span className="font-bold text-accent">Configuración</span>.</li>
            <li>Vinculá la tienda con tu perfil de <span className="font-bold text-accent">MercadoPago</span>.</li>
            <li>Define los horarios de atención y verifica que el estado de la tienda sea <span className="font-bold text-accent">“Abierto”</span>.</li>
            <li>En la sección <span className="font-bold text-accent">WhatsApp</span>, configurá un mensaje para que tus clientes conozcan tu tienda.</li>
            <li>Crea las categorías principales y agrega al menos <span className="font-bold text-accent">5 productos</span>.</li>
            <li>Realiza un pedido de prueba desde la tienda pública para validar el flujo completo y ¡Listo!</li>
          </ol>
        </div>
      </header>

      <section aria-labelledby="indice">
        <h2 id="indice" className="text-xl font-semibold">Inicio rápido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Visitá cualquier sección con un solo clic. Cada enlace te lleva al apartado correspondiente de esta guía.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {sections.map((section) => (
            <Link key={section.id} href={`#${section.id}`} className="rounded-lg border bg-background p-4 transition hover:border-primary">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="space-y-16">
        {/* GUIA DE CONFIGURACION */}
        <section id="guia-inicio" className="space-y-4">
          <h2 className="text-2xl font-semibold text-primary">Guía de configuración de la tienda</h2>
          <p className="text-muted-foreground">
            Si es tu primera vez en el panel, comienza aquí. En menos de 15 minutos puedes dejar listo lo esencial y abrir tu tienda al público.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-2">Configuración Inicial</h3>
              <ol className="list-decimal space-y-3 pl-4 text-sm text-muted-foreground">
                <li>
                  Ingresa a la sección <span className="font-bold text-primary">Configuración</span>, luego en <span className="font-bold text-primary">Tienda</span>:
                  <ul className="list-[lower-alpha] mt-2 space-y-1 pl-6">
                    <li>Registra el nombre de la Tienda y teléfono.</li>
                    <li>Carga logotipo y la Imagen de Header.</li>
                    <li>Completa con una descripción breve o tu slogan.</li>
                    <li>Ingresa tu dirección, incluyendo ciudad y provincia, y comprueba la ubicación en el mapa.</li>
                    <li>Si el delivery está incluido, completa los datos solicitados.</li>
                    <li>¡No olvides <span className="font-bold">Guardar los cambios</span>!</li>
                  </ul>
                </li>
                <li>En <span className="font-bold text-accent">Información ampliada</span> podés sumar la historia de tu negocio, propuesta gastronómica y fotos del local.</li>
                <li>Configurá <span className="font-bold text-accent">Horarios</span> para que los clientes sepan cuándo atenderás.</li>
                <li>
                  En la sección <span className="font-bold text-accent">Pagos</span>:
                  <ul className="list-[lower-alpha] mt-2 space-y-1 pl-6">
                    <li>Vinculá tu cuenta de MercadoPago siguiendo las instrucciones.</li>
                    <li>Definí si aceptás Pago en Efectivo y si aplicás descuentos por este método.</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* INFO GENERAL */}
        <section id="info-general" className="space-y-4">
          <h2 className="text-2xl font-semibold">Info General</h2>
          <p className="text-muted-foreground">En esta sección podés ver un panorama de tu negocio:</p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Visualización de los últimos pedidos.</li>
            <li>Acceso directo a distintas secciones del administrador.</li>
            <li>Breve estadística de ventas diarias.</li>
          </ul>
        </section>

        {/* CATEGORIAS */}
        <section id="categorias" className="space-y-4">
          <h2 className="text-2xl font-semibold">Categorías</h2>
          <p className="text-muted-foreground">
            Organiza tu catálogo para que los clientes encuentren lo que buscan sin esfuerzo. Agrupá productos similares y usa nombres cortos (ej. “Entradas”, “Bebidas sin alcohol”, “Vinos”).
          </p>
        </section>

        {/* PRODUCTOS */}
        <section id="productos" className="space-y-4">
          <h2 className="text-2xl font-semibold">Productos</h2>
          <p className="text-muted-foreground">
            Tus productos son el corazón de la tienda. Procurá utilizar fotografías atractivas, descripciones claras y precios actualizados.
          </p>
          <div className="bg-muted/30 p-4 rounded-md space-y-4 text-sm text-muted-foreground">
            <p>Al crear un producto:</p>
            <ul className="list-disc pl-4 space-y-2">
              <li><span className="font-bold text-accent">Nombre:</span> Sé breve pero claro.</li>
              <li><span className="font-bold text-accent">Descripción:</span> Detalla ingredientes o beneficios. Podés usar formato: <strong># Título</strong>, <strong>**Negrita**</strong> o <strong>_Cursiva_</strong>.</li>
              <li><span className="font-bold text-accent">Imágenes:</span> Usa fotos reales con fondo limpio y buena iluminación. La imagen principal es para el listado; la galería para la ficha del producto.</li>
              <li><span className="font-bold text-accent">Disponibilidad:</span> Podés pausar productos temporalmente si te quedas sin stock.</li>
            </ul>
            
            <p className="font-bold pt-2">Adicionales y Opciones</p>
            <p>Configura variantes como tamaños de Pizza, sabores de Empanadas o combos. Permite definir si la selección es Única, Múltiple o por Cantidad.</p>
          </div>
        </section>

        {/* PEDIDOS */}
        <section id="pedidos" className="space-y-4">
          <h2 className="text-2xl font-semibold">Pedidos</h2>
          <p className="text-muted-foreground">
            Desde aquí gestionás todo el flujo de compra. Mantené la página abierta para recibir pedidos; la información se actualiza automáticamente.
          </p>
          <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="border p-4 rounded-lg">
              <p className="font-bold mb-2">Estados del Pedido:</p>
              <ul className="space-y-1">
                <li>• <span className="font-semibold">Pendiente:</span> Nuevo pedido ingresado.</li>
                <li>• <span className="font-semibold">Confirmado:</span> Notifica al cliente que se está preparando.</li>
                <li>• <span className="font-semibold">Listo:</span> Preparado para ser retirado.</li>
                <li>• <span className="font-semibold">Enviado/Entregado:</span> Seguimiento final de la entrega.</li>
              </ul>
            </div>
            <div className="border p-4 rounded-lg">
              <p className="font-bold mb-2">Gestión:</p>
              <p>Cada tarjeta incluye código, datos del cliente con link a WhatsApp, monto y forma de pago. Verificá siempre el ingreso de dinero en tu cuenta de MercadoPago.</p>
            </div>
          </div>
        </section>

        {/* ESTADISTICAS */}
        <section id="estadisticas" className="space-y-4">
          <h2 className="text-2xl font-semibold">Estadísticas</h2>
          <p className="text-muted-foreground">
            Analiza el desempeño de tu Store: revisa ventas para detectar tendencias, identifica productos estrella y monitorea el ticket promedio para diseñar mejores promociones.
          </p>
        </section>

        {/* WHATSAPP */}
        <section id="whatsapp" className="space-y-4">
          <h2 className="text-2xl font-semibold">WhatsApp</h2>
          <p className="text-muted-foreground">
            Personaliza el mensaje automático que enviarás cuando los clientes te pidan el link de tu tienda. Compartí el link directo en tus redes sociales para agilizar la venta.
          </p>
        </section>

        {/* OPERACION Y RECOMENDACIONES */}
        <section id="operacion-store" className="space-y-6">
          <h2 className="text-2xl font-semibold">Operación del Store</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-bold">Suscripción</p>
              <p>El sistema informa los días restantes de prueba. Si el servicio no se abona, la tienda pública se desactiva, aunque mantendrás acceso al panel de administración.</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-bold">Recomendaciones</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Revisa horarios en feriados.</li>
                <li>Monitorea pedidos desde la app móvil.</li>
                <li>Actualiza precios para proteger tu margen.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-6 text-center">
            <p className="text-sm font-medium">¿Necesitas más ayuda?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Escríbenos por WhatsApp o envía un correo a: <br/>
              <a className="text-primary font-bold hover:underline" href="mailto:foodynow.ar@gmail.com">foodynow.ar@gmail.com</a>
            </p>
          </div>
        </section>
      </div>
      <ScrollToTop />
    </div>
  )
}