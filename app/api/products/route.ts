import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verify user owns the store
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", productData.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    if (productData.category_id === "0" || productData.category_id === "") {
      productData.category_id = null
    }

    const { data: product, error } = await supabase.from("products").insert(productData).select().single()

    if (error) {
      console.error("Product creation error:", error)
      return NextResponse.json({ error: "Error al crear el producto" }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
