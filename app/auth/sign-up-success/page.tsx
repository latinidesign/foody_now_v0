import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { AuthHeader } from "@/components/auth/auth-header"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />

      <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Revisá tu correo</CardTitle>
              <CardDescription>
                Te enviamos un link de confirmación. Por favor, revisá tu correo y dale click para activar tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-sm">
                ¿Ya confirmado?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Iniciar sesión
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
