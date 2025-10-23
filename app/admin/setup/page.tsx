import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StoreSetupForm } from "@/components/admin/store-setup-form"

export default async function StoreSetupPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user already has a store
  const { data: existingStore } = await supabase.from("stores").select("*").eq("owner_id", user.id).single()

  if (existingStore) {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">¡Bienvenido a Foody Now!</h1>
          <p className="text-muted-foreground mt-2">Configura tu tienda online en pocos pasos</p>
        </div>
        <StoreSetupForm userId={user.id} />
      </div>
    </div>
  )
}
