import type React from "react"
import type { Metadata, Viewport } from "next"
import { MuseoModerno, Open_Sans } from "next/font/google"
import { Toaster } from "sonner"
import { PWAProvider } from "@/components/pwa/pwa-provider"
import "./globals.css"

const museoModerno = MuseoModerno({
  subsets: ["latin"],
  weight: ["300", "700"],
  variable: "--font-museo-moderno",
  display: "swap",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-open-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FOODYNOW - Tiendas Online para Restaurantes",
  description:
    "Plataforma de ecommerce para restaurantes y comercios alimentarios. Crea tu tienda online y recibe pedidos fácilmente.",
  generator: "FOODYNOW",
  applicationName: "FOODYNOW",
  referrer: "origin-when-cross-origin",
  keywords: ["restaurante", "delivery", "comida", "pedidos online", "ecommerce", "tienda online"],
  authors: [{ name: "FOODYNOW" }],
  creator: "FOODYNOW",
  publisher: "FOODYNOW",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://foodynow.com.ar"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "FOODYNOW",
    title: "FOODYNOW - Tiendas Online para Restaurantes",
    description: "Plataforma de ecommerce para restaurantes y comercios alimentarios",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FOODYNOW",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FOODYNOW - Tiendas Online para Restaurantes",
    description: "Plataforma de ecommerce para restaurantes y comercios alimentarios",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FOODYNOW",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "FOODYNOW",
    "msapplication-TileColor": "#2D5016",
    "msapplication-tap-highlight": "no",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2D5016" },
    { media: "(prefers-color-scheme: dark)", color: "#4A7C59" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${openSans.variable} ${museoModerno.variable}`}>
        <PWAProvider>
          {children}
        </PWAProvider>
        <Toaster />
      </body>
    </html>
  )
}
