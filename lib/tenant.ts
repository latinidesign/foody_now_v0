const MAIN_DOMAINS = new Set([
  "foodynow.com.ar",
  "www.foodynow.com.ar",
  "foodynowapp.vercel.app",
  "v0-ecommerce-pwa.vercel.app",
  "localhost",
  "localhost:3000",
  "127.0.0.1",
  "127.0.0.1:3000",
])

const RESERVED_SUBDOMAINS = new Set(["www", "api"])

function normalizeHost(host: string | null | undefined) {
  if (!host) return ""
  return host.split(":")[0].toLowerCase()
}

export function getTenantSlugFromHost(host: string | null | undefined) {
  const hostname = normalizeHost(host)

  if (!hostname || MAIN_DOMAINS.has(hostname)) {
    return null
  }

  if (hostname.endsWith(".foodynow.com.ar")) {
    const slug = hostname.replace(".foodynow.com.ar", "")
    return RESERVED_SUBDOMAINS.has(slug) ? null : slug
  }

  if (hostname.includes("vercel.app")) {
    const parts = hostname.split(".")
    if (parts.length > 2) {
      const slug = parts[0]
      return RESERVED_SUBDOMAINS.has(slug) ? null : slug
    }
  }

  if (hostname.endsWith(".localhost")) {
    const slug = hostname.replace(".localhost", "")
    return RESERVED_SUBDOMAINS.has(slug) ? null : slug
  }

  const parts = hostname.split(".")
  if (parts.length > 2) {
    const slug = parts[0]
    return RESERVED_SUBDOMAINS.has(slug) ? null : slug
  }

  return null
}
