import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productData = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: product } = await supabase
      .from("products")
      .select("store_id, stores!inner(owner_id)")
      .eq("id", params.id)
      .single()

    if (!product || product.stores.owner_id !== user.id) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    if (productData.category_id === "0" || productData.category_id === "") {
      productData.category_id = null
    }

    const { data: updatedProduct, error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Product update error:", error)
      return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 })
    }

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: product } = await supabase
      .from("products")
      .select("store_id, stores!inner(owner_id)")
      .eq("id", params.id)
      .single()

    if (!product || product.stores.owner_id !== user.id) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const { error } = await supabase.from("products").delete().eq("id", params.id)

    if (error) {
      console.error("Product deletion error:", error)
      return NextResponse.json({ error: "Error al eliminar el producto" }, { status: 500 })
    }

    return NextResponse.json({ message: "Producto eliminado exitosamente" })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
