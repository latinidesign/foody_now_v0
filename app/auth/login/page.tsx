import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <LoginForm />
        <div className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/register" className="text-primary hover:underline font-medium">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  )
}
