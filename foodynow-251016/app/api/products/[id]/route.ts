import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requestData = await request.json()
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

    const { product_options, ...productData } = requestData

    if (productData.category_id === "0" || productData.category_id === "") {
      productData.category_id = null
    }

    // Update the product in the products table (without product_options)
    const { data: updatedProduct, error: productError } = await supabase
      .from("products")
      .update(productData)
      .eq("id", params.id)
      .select()
      .single()

    if (productError) {
      console.error("Product update error:", productError)
      return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 })
    }

    if (product_options && Array.isArray(product_options)) {
      // First, delete existing options for this product
      const { error: deleteOptionsError } = await supabase.from("product_options").delete().eq("product_id", params.id)

      if (deleteOptionsError) {
        console.error("Error deleting existing options:", deleteOptionsError)
        return NextResponse.json({ error: "Error al actualizar las opciones" }, { status: 500 })
      }

      // Insert new options
      for (const option of product_options) {
        const { data: newOption, error: optionError } = await supabase
          .from("product_options")
          .insert({
            product_id: params.id,
            name: option.name,
            type: option.type,
            is_required: option.is_required,
          })
          .select()
          .single()

        if (optionError) {
          console.error("Error creating option:", optionError)
          return NextResponse.json({ error: "Error al crear las opciones" }, { status: 500 })
        }

        // Insert option values
        if (option.values && Array.isArray(option.values)) {
          const optionValues = option.values.map((value: any) => ({
            option_id: newOption.id,
            name: value.name,
            price_modifier: value.price_modifier,
          }))

          const { error: valuesError } = await supabase.from("product_option_values").insert(optionValues)

          if (valuesError) {
            console.error("Error creating option values:", valuesError)
            return NextResponse.json({ error: "Error al crear los valores de opciones" }, { status: 500 })
          }
        }
      }
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
