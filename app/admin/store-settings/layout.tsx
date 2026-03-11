import type React from "react"
import { redirect } from "next/navigation"

export default function AdminStoreSettingsLayout({ children }: { children: React.ReactNode }) {
  // Redireccionar a /store-settings
  redirect("/store-settings")
}
