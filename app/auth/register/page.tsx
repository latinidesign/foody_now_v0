import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <RegisterForm />
        <div className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
