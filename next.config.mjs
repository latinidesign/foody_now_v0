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
    return {
      beforeFiles: [
        // Rewrite para subdominios de tiendas
        {
          source: '/:path((?!(?:_next|manifest\\.json|api)(?:/|$)).*)',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>.*)\\.foodynow\\.com\\.ar',
            },
          ],
          destination: '/store/:subdomain/:path',
        },
        {
          source: '/',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>.*)\\.foodynow\\.com\\.ar',
            },
          ],
          destination: '/store/:subdomain',
        },
      ],
    }
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
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },
}

export default nextConfig
