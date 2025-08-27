import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Get user's store
    const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).single()

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", store.id)
      .order("name")

    if (error) {
      console.error("Categories fetch error:", error)
      return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const categoryData = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Get user's store
    const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).single()

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        ...categoryData,
        store_id: store.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Category creation error:", error)
      return NextResponse.json({ error: "Error al crear la categoría" }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
