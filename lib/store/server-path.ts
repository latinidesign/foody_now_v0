import { headers } from "next/headers"
import { getStoreBasePath } from "./path"

export async function getStoreBasePathFromHeaders(slug: string) {
  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  return getStoreBasePath(host, slug)
}
