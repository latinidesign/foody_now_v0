import { NextRequest } from "next/server"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(req: NextRequest) {
  const supabase = await createClient()    
    const {
      data: { user },
    } = await supabase.auth.getUser()
  
    if (!user) {
      redirect('/auth/login')
    }

  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single()

  return Response.json({ status: data?.status ?? "pending" })
}
