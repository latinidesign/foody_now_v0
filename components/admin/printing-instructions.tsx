interface PrintingInstructionsProps {
  browserName?: string
}

export function PrintingInstructions({ browserName }: PrintingInstructionsProps) {
  const showAll = !browserName

  const ChromeSection = () => (
    <div>
      <p className="font-semibold">Google Chrome:</p>
      <p className="text-xs text-muted-foreground mt-1">Agregá el flag <code className="bg-muted px-1 rounded">--kiosk-printing</code> al acceso directo. No requiere modo kiosk completo.</p>
      <div className="p-3 bg-muted rounded-md text-xs font-mono mt-1">
        "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing https://foodynow.com.ar/admin/orders
      </div>
    </div>
  )

  const EdgeSection = () => (
    <div>
      <p className="font-semibold">Microsoft Edge:</p>
      <p className="text-xs text-muted-foreground mt-1">
        Edge requiere <strong>full kiosk mode</strong> (pantalla completa, sin barra de direcciones, sin pestañas).
        Usá estos tres flags juntos:
      </p>
      <div className="p-3 bg-muted rounded-md text-xs font-mono mt-1">
        "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk --edge-kiosk-type=fullscreen --kiosk-printing https://foodynow.com.ar/admin/orders
      </div>
    </div>
  )

  const FirefoxSection = () => (
    <div>
      <p className="font-semibold">Mozilla Firefox:</p>
      <p className="text-xs text-muted-foreground mt-1">
        Firefox no tiene flag de línea de comandos para impresión silenciosa. En su lugar:
      </p>
      <ol className="list-decimal list-inside text-xs mt-1 space-y-1">
        <li>Escribí <code className="bg-muted px-1 rounded">about:config</code> en la barra de direcciones</li>
        <li>Aceptá el riesgo</li>
        <li>Buscá <code className="bg-muted px-1 rounded">print.always_print_silent</code></li>
        <li>Cambialo a <code className="bg-muted px-1 rounded">true</code></li>
      </ol>
    </div>
  )

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Configurar impresión automática</h2>
      <p className="text-muted-foreground">
        FoodyNow imprime los tickets directamente desde el navegador. Para una
        experiencia sin intervención seguí los pasos según tu navegador.
      </p>
      <ol className="space-y-3 list-decimal list-inside text-sm">
        <li>
          <strong>Paso 1:</strong> Configurá tu impresora térmica como
          predeterminada del sistema.
        </li>
        <li>
          <strong>Paso 2:</strong> Según tu navegador, creá un acceso directo en
          el escritorio con el comando indicado abajo.
          <div className="mt-2 space-y-3 ml-4">
            {showAll || browserName === "chrome" ? <ChromeSection /> : null}
            {showAll || browserName === "edge" ? <EdgeSection /> : null}
            {showAll || browserName === "firefox" ? <FirefoxSection /> : null}
            {showAll ? (
              <p className="text-xs text-muted-foreground">
                {browserName === "safari" || browserName === "otro" || browserName === "ssr"
                  ? "Tu navegador no soporta impresión silenciosa automática. Usá Chrome, Edge o Firefox."
                  : null}
              </p>
            ) : null}
          </div>
        </li>
        <li>
          <strong>Paso 3:</strong> <em>Antes de abrir el acceso directo,</em>{" "}
          cerrá completamente el navegador. Verificá en el Administrador de
          tareas (Ctrl+Shift+Esc) que no queden procesos del navegador activos.
          Si no lo cerrás por completo, los flags no se aplican.
        </li>
        <li>
          <strong>Paso 4:</strong> Abrí el panel de pedidos desde el acceso
          directo que creaste.
        </li>
        <li>
          <strong>Paso 5:</strong> Activá la opción{" "}
          <em>"Impresión automática"</em> en el panel de pedidos. Cada nuevo
          pedido se imprimirá automáticamente.
        </li>
      </ol>
      <p className="text-sm text-muted-foreground">
        Sin los flags indicados, al imprimir se abrirá el diálogo del navegador.
        Hacé clic en <strong>Imprimir</strong> (un solo clic, sin configuración
        adicional).
      </p>
      <p className="text-sm text-muted-foreground">
        <strong>Nota:</strong> Safari y otros navegadores no tienen soporte para
        impresión silenciosa. La impresión manual sigue disponible desde el
        botón <strong>Imprimir ticket</strong> de cada pedido.
      </p>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">
          Info de diagnóstico
        </summary>
        <p className="mt-2">
          Si algo no funciona, abrí la consola del navegador (F12 → Console) y
          buscá mensajes con{" "}
          <code className="bg-muted px-1 rounded">[BrowserPrint]</code>.
          También verificá que el acceso directo incluya exactamente los flags
          indicados (dos guiones).
        </p>
      </details>
    </div>
  )
}
