export const MAIN_STORE_HOSTS = [
  "foodynow.com.ar",
  "www.foodynow.com.ar",
  "foodynowapp.vercel.app",
  "v0-ecommerce-pwa.vercel.app",
  "localhost",
  "localhost:3000",
  "127.0.0.1",
  "127.0.0.1:3000",
]

const normalizeHost = (host: string | null) => host?.toLowerCase() ?? ""

const removePort = (host: string) => host.split(":")[0]

export function isStoreSubdomainHost(host: string | null, slug: string) {
  if (!host) {
    return false
  }

  const normalizedHost = normalizeHost(host)
  const hostWithoutPort = removePort(normalizedHost)
  const normalizedSlug = slug.toLowerCase()

  const isMainHost = MAIN_STORE_HOSTS.some((mainHost) => {
    const normalizedMain = mainHost.toLowerCase()
    return normalizedHost === normalizedMain || hostWithoutPort === normalizedMain
  })

  if (isMainHost) {
    return false
  }

  return hostWithoutPort.startsWith(`${normalizedSlug}.`)
}

export function getStoreBasePath(host: string | null, slug: string) {
  return isStoreSubdomainHost(host, slug) ? "/" : `/store/${slug}`
}

export function combineStorePath(basePath: string, path = "/") {
  const normalizedBase = basePath === "/" ? "" : basePath.replace(/\/$/, "")
  const normalizedPath = path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`

  if (!normalizedBase) {
    return normalizedPath
  }

  if (normalizedPath === "/") {
    return normalizedBase || "/"
  }

  return `${normalizedBase}${normalizedPath}`
}

export function deriveStoreBasePathFromPathname(pathname: string | null, slug: string) {
  if (!pathname) {
    return `/store/${slug}`
  }

  const normalizedPath = pathname.toLowerCase()
  const normalizedSlug = slug.toLowerCase()

  if (normalizedPath.startsWith(`/store/${normalizedSlug}`)) {
    return `/store/${slug}`
  }

  return "/"
}
