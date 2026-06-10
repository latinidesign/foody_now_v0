export function PrintingInstructions() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Configurar impresión automática</h2>
      <p className="text-muted-foreground">
        FoodyNow imprime los tickets directamente desde el navegador. Para una
        experiencia sin intervención, usá Google Chrome o Microsoft Edge con el
        flag <code className="bg-muted px-1 rounded text-xs">--kiosk-printing</code>.
      </p>
      <ol className="space-y-3 list-decimal list-inside text-sm">
        <li>
          <strong>Paso 1:</strong> Asegurate de tener Google Chrome o Microsoft
          Edge instalado. Estos son los únicos navegadores soportados para
          impresión automática.
        </li>
        <li>
          <strong>Paso 2:</strong> Configurá tu impresora térmica como
          predeterminada del sistema.
        </li>
        <li>
          <strong>Paso 3:</strong> Abrí el panel de pedidos desde un acceso
          directo con el flag{" "}
          <code className="bg-muted px-1 rounded text-xs">--kiosk-printing</code>
          :
          <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono space-y-1">
            <p className="font-semibold">Chrome:</p>
            <p>
              "C:\Program Files\Google\Chrome\Application\chrome.exe"
              --kiosk-printing https://foodynow.com.ar/admin/orders
            </p>
            <p className="font-semibold mt-2">Edge:</p>
            <p>
              "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
              --kiosk-printing https://foodynow.com.ar/admin/orders
            </p>
          </div>
        </li>
        <li>
          <strong>Paso 4:</strong> Crea un acceso directo en el escritorio con
          ese comando para abrir el panel siempre con impresión silenciosa.
        </li>
        <li>
          <strong>Paso 5:</strong> Activá la opción <em>"Impresión automática"</em>{" "}
          en el panel de pedidos. Cada nuevo pedido se imprimirá solo.
        </li>
      </ol>
      <p className="text-sm text-muted-foreground">
        Sin el flag{" "}
        <code className="bg-muted px-1 rounded text-xs">--kiosk-printing</code>, al
        imprimir se abrirá el diálogo del navegador. Hacé clic en
        <strong> Imprimir</strong> (un solo clic, sin configuración adicional).
      </p>
      <p className="text-sm text-muted-foreground">
        <strong>Nota:</strong> Si usás otro navegador (Firefox, Safari, Opera), la
        impresión manual sigue disponible desde el botón{" "}
        <strong>Imprimir ticket</strong> de cada pedido. La impresión automática
        solo funciona en Chrome o Edge con el flag indicado.
      </p>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">Info de diagnóstico</summary>
        <p className="mt-2">
          Si algo no funciona, abrí la consola del navegador (F12 → Console) y
          buscá mensajes con <code className="bg-muted px-1 rounded">[BrowserPrint]</code>.
          También verificá que el acceso directo incluya exactamente{" "}
          <code className="bg-muted px-1 rounded">--kiosk-printing</code> (dos guiones).
        </p>
      </details>
    </div>
  )
}
