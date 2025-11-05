import Link from "next/link"

const sections = [
  {
    id: "guia-inicio",
    title: "Guía de inicio rápido",
    description:
      "Completa estos pasos para dejar tu tienda lista para recibir pedidos. Sigue el orden sugerido y revisa cada sección para asegurarte de que todo está configurado.",
  },
  {
    id: "info-general",
    title: "Info General",
    description:
      "Define los datos básicos que tus clientes verán en la tienda pública: nombre, descripción, logo, portada, teléfono y dirección.",
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
    id: "notificaciones",
    title: "Notificaciones",
    description:
      "Configura alertas por correo o push para saber cuándo llega un pedido nuevo o si falta información.",
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description:
      "Automatiza la confirmación de pedidos y la atención al cliente integrando tu número de WhatsApp Business.",
  },
  {
    id: "configuracion",
    title: "Configuración",
    description:
      "Administra la información fiscal, métodos de pago y reglas personalizadas de la tienda.",
  },
  {
    id: "operacion-store",
    title: "Operación del Store",
    description:
      "Mantén tu tienda disponible, controla horarios, disponibilidad y la experiencia del cliente en todo momento.",
  },
]

export default function AdminHelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <header className="space-y-4">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide">Centro de ayuda</p>
        <h1 className="text-3xl font-bold tracking-tight">Configura tu Store paso a paso</h1>
        <p className="text-muted-foreground">
          Esta guía está pensada para ti, dueño del Store. Recorre cada sección del panel de administración
          y descubre consejos prácticos para activar tu tienda y vender sin complicaciones.
        </p>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Checklist inicial</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Completa los datos de Info General e incluye un logo atractivo.</li>
            <li>Crea tus categorías principales y agrega al menos 5 productos.</li>
            <li>Define los horarios de atención y verifica que el estado del Store sea “Abierto”.</li>
            <li>Activa los métodos de notificación y, si aplica, conecta tu WhatsApp Business.</li>
            <li>Realiza un pedido de prueba desde la tienda pública para validar el flujo completo.</li>
          </ol>
        </div>
      </header>

      <section aria-labelledby="indice">
        <h2 id="indice" className="text-xl font-semibold">
          Índice rápido
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Visita cualquier sección con un solo clic. Cada enlace te lleva al apartado correspondiente de esta guía.
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
        <section id="guia-inicio" className="space-y-4">
          <h2 className="text-2xl font-semibold">Guía de inicio rápido</h2>
          <p className="text-muted-foreground">
            Si es tu primera vez en el panel, comienza aquí. En menos de 15 minutos puedes dejar listo lo esencial y
            abrir tu Store al público.
          </p>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>
              Revisa la sección <Link className="text-primary hover:underline" href="#info-general">Info General</Link> y carga logotipo, portada y descripción.
            </li>
            <li>Crea categorías y productos siguiendo las recomendaciones de las siguientes secciones.</li>
            <li>Configura horarios y métodos de contacto para que los clientes sepan cuándo atenderás sus pedidos.</li>
            <li>Haz clic en “Ver Mi Tienda” para validar cómo se ve todo desde el punto de vista del comprador.</li>
          </ol>
        </section>

        <section id="info-general" className="space-y-4">
          <h2 className="text-2xl font-semibold">Info General</h2>
          <p className="text-muted-foreground">
            En esta sección defines la identidad del Store. La información que cargues aquí aparece en la cabecera de tu
            tienda y en los resultados de búsqueda dentro de la plataforma.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Completa nombre comercial, descripción breve y categorías de negocio.</li>
            <li>Sube un logotipo y una imagen de portada en buena resolución (recomendado 1024px de ancho).</li>
            <li>
              Indica dirección, zonas de entrega y número de contacto. Si tienes varios números, prioriza el que esté siempre disponible.
            </li>
            <li>Define tus horarios de atención. Puedes activar horarios especiales para días festivos.</li>
          </ul>
        </section>

        <section id="productos" className="space-y-4">
          <h2 className="text-2xl font-semibold">Productos</h2>
          <p className="text-muted-foreground">
            Tus productos son el corazón de la tienda. Mantén fotografías atractivas, descripciones claras y precios actualizados.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Usa fotografías reales, con fondo limpio y buena iluminación.</li>
            <li>Describe ingredientes, porciones o beneficios clave para reducir preguntas de los clientes.</li>
            <li>Configura variantes o complementos si tu catálogo lo requiere (por ejemplo tamaños o extras).</li>
            <li>Desactiva temporalmente un producto si se agota: no perderás la información y podrás reactivarlo cuando vuelva.</li>
          </ul>
        </section>

        <section id="categorias" className="space-y-4">
          <h2 className="text-2xl font-semibold">Categorías</h2>
          <p className="text-muted-foreground">
            Organiza tu catálogo para que los clientes encuentren lo que buscan sin esfuerzo.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Agrupa productos similares y usa nombres cortos (ej. “Entradas”, “Bebidas”).</li>
            <li>Ordena las categorías según su importancia o lo que quieras destacar.</li>
            <li>Oculta categorías sin productos publicados para no mostrar espacios vacíos.</li>
          </ul>
        </section>

        <section id="pedidos" className="space-y-4">
          <h2 className="text-2xl font-semibold">Pedidos</h2>
          <p className="text-muted-foreground">
            Desde aquí gestionas todo el flujo de compra. Un seguimiento ordenado reduce tiempos de espera y mejora la experiencia del cliente.
          </p>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Revisa cada pedido nuevo y confirma disponibilidad en menos de 5 minutos.</li>
            <li>Actualiza el estado (en preparación, listo, entregado) para que el cliente reciba notificaciones claras.</li>
            <li>Usa las notas internas para coordinar con tu equipo o registrar cambios especiales.</li>
            <li>Si necesitas rechazar un pedido, explica el motivo para mantener la confianza del cliente.</li>
          </ol>
        </section>

        <section id="estadisticas" className="space-y-4">
          <h2 className="text-2xl font-semibold">Estadísticas</h2>
          <p className="text-muted-foreground">
            Analiza el desempeño de tu Store y toma decisiones basadas en datos.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Revisa ventas diarias, semanales y mensuales para detectar tendencias.</li>
            <li>Identifica tus productos estrella y aquellos con baja rotación para ajustar precios o promociones.</li>
            <li>Monitorea el ticket promedio y diseña combos o descuentos para elevarlo.</li>
          </ul>
        </section>

        <section id="notificaciones" className="space-y-4">
          <h2 className="text-2xl font-semibold">Notificaciones</h2>
          <p className="text-muted-foreground">
            Mantente informado en todo momento para no perder pedidos.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Configura alertas por correo para el dueño y los encargados de cocina o repartidores.</li>
            <li>Activa notificaciones push en los dispositivos que uses con mayor frecuencia.</li>
            <li>Revisa periódicamente el historial para confirmar que todos los eventos se recibieron correctamente.</li>
          </ul>
        </section>

        <section id="whatsapp" className="space-y-4">
          <h2 className="text-2xl font-semibold">WhatsApp</h2>
          <p className="text-muted-foreground">
            La integración con WhatsApp Business agiliza la comunicación directa con tus clientes.
          </p>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Verifica que tu número esté dado de alta en WhatsApp Business y tenga acceso al API oficial.</li>
            <li>Sigue el asistente de configuración para vincular tu número y autorizar el envío de mensajes.</li>
            <li>Personaliza las plantillas automáticas de confirmación y seguimiento post-venta.</li>
            <li>Usa respuestas rápidas para preguntas frecuentes como costos de envío o métodos de pago.</li>
          </ol>
        </section>

        <section id="configuracion" className="space-y-4">
          <h2 className="text-2xl font-semibold">Configuración</h2>
          <p className="text-muted-foreground">
            Aquí administras aspectos avanzados del Store.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Ingresa tus datos fiscales y métodos de facturación si los clientes requieren CFDI o comprobantes.</li>
            <li>Activa y prueba los métodos de pago disponibles (transferencia, contraentrega, pasarela online).</li>
            <li>Define costos y tiempos de envío por zona para evitar confusiones durante la compra.</li>
            <li>Configura políticas de cancelación, devoluciones y privacidad para cumplir con las regulaciones locales.</li>
          </ul>
        </section>

        <section id="operacion-store" className="space-y-4">
          <h2 className="text-2xl font-semibold">Operación del Store</h2>
          <p className="text-muted-foreground">
            Mantén una operación consistente para ofrecer experiencias memorables.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Revisa tus horarios cada semana y usa cierres temporales cuando tengas mantenimientos o inventario limitado.</li>
            <li>Monitorea la bandeja de pedidos desde la app móvil o la web para responder rápido a tus clientes.</li>
            <li>Actualiza precios y disponibilidad frente a cambios de proveedores para proteger tu margen.</li>
            <li>Solicita reseñas a tus clientes frecuentes y compártelas en redes para atraer nuevos compradores.</li>
          </ul>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            ¿Necesitas más ayuda? Escríbenos desde la sección de <Link className="text-primary hover:underline" href="/admin/settings#soporte">Soporte</Link> o
            envía un correo a <a className="text-primary hover:underline" href="mailto:soporte@foodynow.com">soporte@foodynow.com</a>.
          </div>
        </section>
      </div>
    </div>
  )
}
