declare module 'qz-tray' {
  export type QzPrintConfig = any
  export type QzPrintData = { type: string; format?: string; data: any }

  export const websocket: {
    connect: () => Promise<void>
    disconnect: () => Promise<void>
    isConnected?: () => boolean
  }

  export const printers: {
    getDefault: () => Promise<string>
  }

  export const configs: {
    create: (printerName: string) => QzPrintConfig
  }

  export const print: (config: QzPrintConfig, data: QzPrintData[]) => Promise<void>

  const qz: {
    websocket: typeof websocket
    printers: typeof printers
    configs: typeof configs
    print: typeof print
  }

  export default qz
}
