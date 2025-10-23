import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
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
      .eq("id", requestData.store_id)
      .eq("owner_id", user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    const { product_options, ...productData } = requestData

    if (productData.category_id === "0" || productData.category_id === "") {
      productData.category_id = null
    }

    // Create the product in the products table (without product_options)
    const { data: product, error: productError } = await supabase.from("products").insert(productData).select().single()

    if (productError) {
      console.error("Product creation error:", productError)
      return NextResponse.json({ error: "Error al crear el producto" }, { status: 500 })
    }

    if (product_options && Array.isArray(product_options)) {
      // Insert new options
      for (const option of product_options) {
        const { data: newOption, error: optionError } = await supabase
          .from("product_options")
          .insert({
            product_id: product.id,
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

    return NextResponse.json({ product })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
