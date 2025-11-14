import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Demo - FOODYNOW",
  description: "Explora todas las funcionalidades de FOODYNOW en modo demostración",
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
