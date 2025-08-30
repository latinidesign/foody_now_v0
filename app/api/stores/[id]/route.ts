import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const storeData = await request.json()
    const supabase = await createClient()

    const { data: store, error } = await supabase
      .from("stores")
      .update({
        name: storeData.name,
        description: storeData.description,
        phone: storeData.phone,
        email: storeData.email,
        address: storeData.address,
        logo_url: storeData.logo_url,
        header_image_url: storeData.header_image_url,
        delivery_radius: storeData.delivery_radius,
        delivery_fee: storeData.delivery_fee,
        min_order_amount: storeData.min_order_amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Store update error:", error)
      return NextResponse.json({ error: "Error al actualizar la tienda" }, { status: 500 })
    }

    return NextResponse.json({ store })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: store, error } = await supabase.from("stores").select("*").eq("id", params.id).single()

    if (error) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ store })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
