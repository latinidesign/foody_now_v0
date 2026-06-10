import { Download } from "lucide-react"

export function QzTrayInstructions() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Configurar impresión automática</h2>
      <p className="text-muted-foreground">
        QZ Tray es una aplicación gratuita que permite a FoodyNow enviar tickets
        directamente a tu impresora sin intervención manual. Una vez instalada,
        cada nuevo pedido se imprimirá automáticamente.
      </p>
      <ol className="space-y-3 list-decimal list-inside text-sm">
        <li>
          <strong>Paso 1:</strong> Descargá QZ Tray desde el botón de descarga.
        </li>
        <li>
          <strong>Paso 2:</strong> Ejecutá el instalador descargado. No necesitás
          instalar Java por separado.
        </li>
        <li>
          <strong>Paso 3:</strong> Una vez instalado, abrí QZ Tray desde el menú
          de inicio.
        </li>
        <li>
          <strong>Paso 4:</strong> En el ícono de la bandeja del sistema, activá{" "}
          <em>Automatically Start</em> para que arranque automáticamente con
          Windows.
        </li>
        <li>
          <strong>Paso 5:</strong>{" "}
          <a
            href="/override.crt"
            target="_blank"
            className="underline hover:no-underline"
          >
            Descargá el archivo override.crt
          </a>{" "}
          y copialo a{" "}
          <code className="bg-muted px-1 rounded text-xs">
            C:\Program Files\QZ Tray\override.crt
          </code>
          . Esto permite que QZ Tray confíe en FoodyNow para imprimir sin
          diálogos de confirmación. Si QZ Tray ya estaba abierto, reinicialo
          (clic derecho en el ícono de la bandeja → <em>Exit</em>, y volvé a
          abrirlo).
        </li>
        <li>
          <strong>Paso 6:</strong> Volvé al panel de pedidos — la impresión
          automática estará activa.
        </li>
      </ol>
      <p className="text-sm text-muted-foreground">
        La primera vez que uses la impresión automática, el navegador puede mostrar
        un aviso de seguridad de QZ Tray. Hacé clic en Permitir o Confiar para
        habilitarlo.
      </p>
      <a
        href="https://qz.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition"
      >
        <Download className="w-4 h-4" />
        Descargar QZ Tray
      </a>
    </div>
  )
}
