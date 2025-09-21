/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Reescribir subdominios a rutas internas evitando recursos estáticos
      {
        source:
          '/:path((?!_next/|favicon\\.ico|robots\\.txt|.*\\.[^/]+).*)',
        has: [
          {
            type: 'host',
            value: '(?<subdomain>.*)\\.foodynow\\.com\\.ar',
          },
        ],
        destination: '/store/:subdomain/:path',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ]
  },
}

export default nextConfig
