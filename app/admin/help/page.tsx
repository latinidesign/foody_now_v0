import Link from "next/link"
import ScrollToTop from '@/components/admin/ScrollToTop'

const sections = [
  {
    id: "guia-inicio",
    title: "Configuración de la tienda",
    description:
      "Completa estos pasos para dejar tu tienda lista para recibir pedidos. Sigue el orden sugerido y revisa cada sección.",
  },
  {
    id: "info-general",
    title: "Info General",
    description:
      "Define los datos básicos que tus clientes verán en la tienda pública: nombre, descripción, logo, portada, teléfono y dirección.",
  },
  {
    id: "categorias",
    title: "Categorías",
    description:
      "Agrupá tus productos para que tus clientes naveguen más rápido. Usá un orden lógico y descripciones cortas.",
  },
  {
    id: "productos",
    title: "Productos",
    description:
      "Creá y gestioná el catálogo con fotos, precios y disponibilidad. Podés habilitar o pausar productos en cualquier momento.",
  },
  {
    id: "comunicacion",
    title: "Comunicación",
    description:
      "Personalizá mensajes para compartir por WhatsApp y redes que incluyan el link a tu tienda.",
  },
  {
    id: "pedidos",
    title: "Pedidos",
    description:
      "Administrá el flujo de compra: recibí, confirmá, preparás y entregás. Cada pedido muestra el canal y el estado actual.",
  },
  {
    id: "estadisticas",
    title: "Estadísticas",
    description:
      "Consultá métricas de ventas, tickets promedio y productos más vendidos para optimizar tu oferta.",
  },
  {
    id: "suscripcion",
    title: "Suscripción",
    description:
      "Administrá la suscripción al servicio de FoodyNow.",
  },
  {
    id: "recomendaciones",
    title: "Recomendaciones",
    description:
      "Mantén tu tienda disponible, controlá horarios, disponibilidad y la experiencia del cliente en todo momento.",
  },
]

export default function AdminHelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <header className="space-y-4">
        <p className="text-base font-semibold text-primary uppercase tracking-wide">Centro de ayuda</p>
        <h1 className="text-3xl font-bold tracking-tight">Configura tu Tienda paso a paso</h1>
        <p className="text-muted-foreground">
          Esta guía está pensada para vos como dueño de la tienda. Recorre cada sección del panel de administración y descubrí consejos prácticos para activar tu tienda y vender sin complicaciones.
        </p>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Checklist de Inicio Rápido</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Completá los datos de tu tienda en la sección <Link className="text-primary hover:underline" href="#guia-inicio"><span className="font-bold">Configuración.</span></Link></li>
            <li>Vinculá la tienda con tu perfil de <span className="font-bold text-accent">MercadoPago</span>.</li>
            <li>Definí los <span className="font-bold text-accent">Horarios</span> de atención y verificá que el estado de la tienda sea &quot;Abierto&quot;.</li>
            <li>En la sección <Link className="text-primary hover:underline" href="#comunicacion"><span className="font-bold text-accent">Comunicación</span></Link>, obtené un mensaje para compartir con tus clientes y que accedan a tu tienda.</li>
            <li>Creá las <span className="font-bold text-accent">Categorías</span> principales y agregá al menos 5 <span className="font-bold text-accent">Productos</span>.</li>
            <li>En <span className="font-bold text-accent">Ver Mi Tienda</span>, revisá cómo se ve y realizá un pedido de prueba para validar el flujo completo. ¡Ya podés comenzar a vender!</li>
          </ol>
        </div>
      </header>

      <section aria-labelledby="indice">
        <h2 id="indice" className="text-xl font-semibold">
          Secciones de esta guía
        </h2>
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

        {/* GUÍA DE CONFIGURACIÓN */}
        <section id="guia-inicio" className="space-y-4">
          <h2 className="text-2xl font-semibold">Guía de configuración de la tienda</h2>
          <p className="text-muted-foreground">
            Si es tu primera vez en el panel, comenzá acá. En menos de 15 minutos podés dejar listo lo esencial y abrir tu tienda al público.
          </p>

          <h3 className="text-lg font-semibold">Configuración general de Tienda</h3>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>
              Ingresá al Menú <Link className="text-primary hover:underline" href="/admin/store-settings"><span className="font-bold text-primary">Configuración</span></Link>. En la sección <span className="font-bold">Tienda</span>, completá los campos con toda la información de tu negocio.
              <ol className="mt-2 list-[lower-alpha] space-y-2 pl-4">
                <li>Registrá el <span className="font-bold text-accent">Nombre de la Tienda</span> y <span className="font-bold text-accent">Teléfono</span>.</li>
                <li>Completá con una <span className="font-bold text-accent">Descripción breve</span> o tu slogan.</li>
                <li>Cargá el <span className="font-bold text-accent">Logotipo de la Tienda</span> y la <span className="font-bold text-accent">Imagen de Header</span> (opcional).</li>
                <li>Ingresá tu <span className="font-bold text-accent">Dirección</span> usando el siguiente formato: Calle y número, Ciudad, Provincia. Verificá la ubicación en el mapa.</li>
                <li>Si el <span className="font-bold text-accent">Delivery</span> está incluido en la compra, completá los datos solicitados. Si no querés incluir el precio, dejá los campos en cero.</li>
                <li><span className="font-bold text-accent">Guardá los cambios</span> al finalizar.</li>
              </ol>
            </li>
            <li>En la sección <span className="font-bold text-accent">Información ampliada</span> podés ampliar la información sobre tu negocio: historia, propuesta gastronómica, etc., y agregar fotos del local en la <span className="font-bold text-accent">Galería de Fotos del Local</span>. No olvides <span className="font-bold text-accent">Guardar los cambios</span> al terminar.</li>
            <li>Configurá <span className="font-bold text-accent">Horarios</span> para que los clientes conozcan los horarios de atención.</li>
            <li>En la sección <span className="font-bold text-accent">Pagos</span> podrás <span className="font-bold text-accent">Conectar MercadoPago</span> siguiendo las instrucciones.</li>
          </ol>

          <h3 className="text-lg font-semibold">Categorías y Productos</h3>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground" start={5}>
            <li>
              Luego de definir la información de la tienda, comenzá la carga de Categorías y Productos.
              <ol className="mt-2 list-[lower-alpha] space-y-2 pl-4">
                <li>Menú <Link className="text-primary hover:underline" href="/admin/categories"><span className="font-bold text-primary">Categorías</span></Link>: registrá cómo querés dividir la información de los productos. Esto simplifica la búsqueda para el cliente.</li>
                <li>Menú <Link className="text-primary hover:underline" href="/admin/products"><span className="font-bold text-primary">Productos</span></Link>: agregá nuevos productos con descripción, fotos y categoría. <Link className="text-accent hover:underline" href="#productos"><span className="font-bold text-accent">Ver la sección Productos para más detalles.</span></Link></li>
              </ol>
            </li>
            <li>Hacé clic en <span className="font-bold text-accent">Ver Mi Tienda</span> para chequear cómo verán los clientes la tienda.</li>
          </ol>
        </section>

        {/* INFO GENERAL */}
        <section id="info-general" className="space-y-4">
          <h2 className="text-2xl font-semibold">Info General</h2>
          <p className="text-muted-foreground">
            En esta sección podés ver un panorama de tu negocio.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Los últimos pedidos.</li>
            <li>Acceso directo a distintas secciones del administrador.</li>
            <li>Breve estadística de ventas.</li>
          </ul>
        </section>

        {/* CATEGORÍAS */}
        <section id="categorias" className="space-y-4">
          <h2 className="text-2xl font-semibold">Categorías</h2>
          <p className="text-muted-foreground">
            Organizá tu catálogo para que los clientes encuentren lo que buscan sin esfuerzo, agrupando productos similares.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Usá nombres cortos, por ejemplo: &quot;Hamburguesas&quot;, &quot;Pizzas&quot;, &quot;Bebidas sin alcohol&quot;, &quot;Vinos&quot;.</li>
            <li>También podés agrupar en una categoría las Ofertas, Promociones o el menú del día.</li>
          </ul>
        </section>

        {/* PRODUCTOS */}
        <section id="productos" className="space-y-4">
          <h2 className="text-2xl font-semibold">Productos</h2>
          <p className="text-muted-foreground">
            Tus productos son el corazón de la tienda. Procurá utilizar fotografías reales y atractivas, descripciones claras y precios actualizados.
          </p>
          <p className="text-sm text-muted-foreground">Creá un nuevo producto desde el botón <span className="font-bold text-accent">Agregar Producto</span>.</p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Completá la información con <span className="font-bold text-accent">Nombre del producto</span>. Sé breve pero claro.</li>
            <li>En <span className="font-bold text-accent">Descripción</span> podés completar con ingredientes o detalles de la presentación.</li>
          </ul>

          <h3 className="text-base font-semibold">Configuración de precios</h3>
          <p className="text-sm text-muted-foreground">Hay tres formas de configurar los precios:</p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li><span className="font-bold text-accent">Precio base.</span> Permite un único precio del producto y la opción de marcar un <span className="font-bold text-accent">Precio de Oferta</span>.</li>
            <li><span className="font-bold text-accent">Precio por unidad, pack o conjunto fijo.</span> Sirve para promociones de cantidades (ej. Catorcena de Empanadas: Precio por pack $30.000 | Cantidad 14. El cliente puede elegir hasta 14 sabores distintos por el precio fijado).</li>
            <li><span className="font-bold text-accent">Precio por unidad / media docena / docena.</span> Para configurar precios diferenciados según la cantidad (x1, x6, x12), sin límite de cantidad y con selección de distintos sabores.</li>
          </ul>

          <h3 className="text-base font-semibold">Categoría e imágenes</h3>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li><span className="font-bold text-accent">Categoría:</span> Es fundamental seleccionar una. Si no existe, podés crear una nueva ahí mismo. El producto sin categoría asignada no será listado.</li>
            <li><span className="font-bold text-accent">Producto disponible:</span> Por defecto se encuentra activada. Podés desactivar temporalmente la disponibilidad de un producto.</li>
            <li><span className="font-bold text-accent">Imagen principal del producto:</span> Es la que se mostrará en el listado. Recomendamos fotografías reales con fondo limpio y buena iluminación.</li>
            <li><span className="font-bold text-accent">Galería de Imágenes:</span> Imágenes adicionales que se mostrarán cuando el cliente ingrese a la ficha del producto.</li>
          </ul>

          <h3 className="text-base font-semibold">Adicionales y Opciones</h3>
          <p className="text-sm text-muted-foreground">Configurá variantes o complementos de tu producto, o armá combos (tamaños, sabores, combos con bebidas). Todos los textos son de ejemplo y pueden modificarse.</p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li><span className="font-bold text-accent">Empanadas (Sabores) — Selección por cantidad.</span> Para agregar sabores y seleccionar distintas cantidades. Permite un diferencial de precio que se suma al total.</li>
            <li><span className="font-bold text-accent">Combos (distintos precios) — Selección única.</span> Para crear combos con diferencia de precios y selección única. Ej. Combo chico, mediano y grande.</li>
            <li><span className="font-bold text-accent">Pizza tamaño — Tamaños.</span> Para definir diferentes tamaños.</li>
            <li><span className="font-bold text-accent">Bebidas (Tamaño / Sabores).</span> Define tamaños con distintos precios o sabores a igual precio.</li>
            <li><span className="font-bold text-accent">Personalizada.</span> Definí tus propios parámetros y el tipo de selección: <span className="font-bold">Única</span> (elige una opción) | <span className="font-bold">Múltiple</span> (más de una opción, ideal para Toppings) | <span className="font-bold">Por cantidad</span> (suma cantidad por distintas opciones).</li>
          </ul>
          <p className="text-sm text-muted-foreground">En todas las opciones se puede modificar el precio en forma adicional al precio base.</p>
        </section>

        {/* LISTO PARA COMPARTIR */}
        <section id="compartir" className="space-y-4">
          <h2 className="text-2xl font-semibold">Listo para compartir y vender</h2>
          <p className="text-muted-foreground">
            Una vez completada la configuración de la tienda y creados los productos, la tienda está lista para ser publicada y compartida.
          </p>
        </section>

        {/* COMUNICACIÓN */}
        <section id="comunicacion" className="space-y-4">
          <h2 className="text-2xl font-semibold">Comunicación</h2>
          <p className="text-muted-foreground">
            Podés usar el mensaje predeterminado o personalizar el mensaje para compartir por WhatsApp y en tus redes y motivar el uso de tu tienda.
          </p>
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li><span className="font-bold text-accent">Mensaje automático para clientes.</span> Personalizá el mensaje que enviarás cuando los clientes te pidan el link de tu tienda.</li>
            <li><span className="font-bold text-accent">Link directo de tu tienda.</span> Compartí este link directamente con tus clientes o cuando necesites configurar tus redes.</li>
          </ol>
        </section>

        {/* PEDIDOS */}
        <section id="pedidos" className="space-y-4">
          <h2 className="text-2xl font-semibold">Pedidos</h2>
          <p className="text-muted-foreground">
            Desde aquí gestionás todo el flujo de compra. Un seguimiento ordenado reduce tiempos de espera y mejora la experiencia del cliente.
          </p>
          <ol className="list-decimal space-y-3 pl-4 text-sm text-muted-foreground">
            <li><span className="font-bold text-accent">Mantené la página abierta para recibir los pedidos.</span> La información se actualiza automáticamente, pero por el momento el sistema no avisa de un nuevo pedido si estás en otra sección.</li>
            <li><span className="font-bold text-accent">Lista de Pedidos.</span> Permite organizar por estado o fecha, y buscar pedidos anteriores por producto o nombre de cliente.</li>
            <li>
              Cada tarjeta de pedido contiene:
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Un código de pedido.</li>
                <li>Nombre del cliente y teléfono.</li>
                <li>Fecha y hora del pedido.</li>
                <li>Monto y cantidad de productos.</li>
                <li><span className="font-bold text-accent">Estado:</span> cada nuevo pedido ingresa en estado <span className="font-bold">Pendiente</span>.</li>
                <li>El botón <span className="font-bold text-accent">Imprimir</span> (🖨) permite la impresión de la comanda. El botón <span className="font-bold text-accent">Ver</span> (👁) muestra el detalle completo del pedido.</li>
              </ul>
            </li>
            <li>
              <span className="font-bold text-accent">Detalles del Pedido:</span> estado, cliente (nombre y link a WhatsApp), tipo de entrega, productos, monto total, forma de pago y notas opcionales del cliente.
              <p className="mt-1">Recomendamos verificar el ingreso del pago en su cuenta de MercadoPago para los pedidos abonados online.</p>
            </li>
            <li>
              <span className="font-bold text-accent">Actualización de estados.</span> En cada cambio, se genera un mensaje automático listo para enviar al cliente por WhatsApp con la información del pedido y su situación.
              <p className="mt-1 italic">Recomendamos instalar WhatsApp en su computadora y habilitar la opción &quot;Siempre permitir que api.whatsapp.com abra este tipo de vínculos en la app asociada.&quot;</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li><span className="font-bold">Pendiente.</span> Ingreso de nuevo pedido.</li>
                <li><span className="font-bold">Confirmado.</span> El pedido fue recibido. Se envía mensaje al cliente de que está siendo preparado.</li>
                <li><span className="font-bold">Preparando.</span> El pedido ingresó a cocina. El mensaje incluye el tiempo estimado de preparación.</li>
                <li><span className="font-bold">Listo.</span> El pedido está listo para ser retirado.</li>
                <li><span className="font-bold">Enviado.</span> Salió el delivery con el pedido.</li>
                <li><span className="font-bold">Entregado.</span> El pedido fue entregado correctamente.</li>
                <li><span className="font-bold">Cancelado.</span> El pedido fue cancelado. Si el cliente abonó por MercadoPago, se deberá gestionar la cancelación dentro de MP.</li>
              </ul>
            </li>
          </ol>
        </section>

        {/* ESTADÍSTICAS */}
        <section id="estadisticas" className="space-y-4">
          <h2 className="text-2xl font-semibold">Estadísticas</h2>
          <p className="text-muted-foreground">
            Analizá el desempeño de tu tienda y tomá decisiones basadas en datos.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Revisá ventas diarias, semanales y mensuales para detectar tendencias.</li>
            <li>Identificá tus productos estrella y aquellos con baja rotación para ajustar precios o promociones.</li>
            <li>Monitoreá el ticket promedio y diseñá combos o descuentos para elevarlo.</li>
          </ul>
        </section>

        {/* SUSCRIPCIÓN */}
        <section id="suscripcion" className="space-y-4">
          <h2 className="text-2xl font-semibold">Suscripción</h2>
          <p className="text-muted-foreground">
            Informa el estado de la suscripción: cuándo se abonó y cuándo vence el servicio.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li>Si todavía te encontrás en período de prueba, informa los días restantes y la opción para abonar ahora.</li>
            <li>Si el servicio no se abona, el sistema se bloquea: la tienda deja de estar activa para el público, aunque sí podrás ingresar al panel de administración.</li>
          </ul>
        </section>

        {/* RECOMENDACIONES */}
        <section id="recomendaciones" className="space-y-4">
          <h2 className="text-2xl font-semibold">Recomendaciones</h2>
          <p className="text-muted-foreground">
            Mantén una operación consistente para ofrecer experiencias memorables.
          </p>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            <li><span className="font-bold text-accent">Revisá tus horarios</span> cada semana para asegurar la correcta atención en feriados o días especiales.</li>
            <li><span className="font-bold text-accent">Monitoreá la bandeja de pedidos</span> desde la app móvil o la web para responder rápido a tus clientes.</li>
            <li><span className="font-bold text-accent">Actualizá precios y disponibilidad</span> frente a cambios para proteger tu margen de utilidad y evitar pedidos de productos sin stock.</li>
            <li><span className="font-bold text-accent">Solicitá reseñas</span> a tus clientes frecuentes y compartílas en redes para atraer nuevos compradores.</li>
          </ul>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            ¿Necesitás más ayuda? Escribínos por{" "}
            <a className="text-primary hover:underline" href="https://wa.me/5492804505920" target="_blank" rel="noreferrer">WhatsApp</a>{" "}
            o enviá un correo a{" "}
            <a className="text-primary hover:underline" href="mailto:foodynow.ar@gmail.com">foodynow.ar@gmail.com</a>.
          </div>
        </section>

      </div>
      <ScrollToTop />
    </div>
  )
}
