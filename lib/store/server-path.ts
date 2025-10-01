import { headers } from "next/headers"
import { getStoreBasePath } from "./path"

export function getStoreBasePathFromHeaders(slug: string) {
  const headerList = headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  return getStoreBasePath(host, slug)
}
