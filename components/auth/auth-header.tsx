import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BeefIcon } from "lucide-react"

export function AuthHeader() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <BeefIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary">FOODYNOW</h1>
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
