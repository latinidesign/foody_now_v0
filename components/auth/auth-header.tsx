import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BeefIcon } from "lucide-react"

export function AuthHeader() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/foodynow_logo-wt.svg"
              alt="FOODYNOW"
              width={100}
              height={45}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant="default">Crear Cuenta</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
