import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
//export async function PUT(request: NextRequest, context: any) {

  try {
    const storeData = await request.json()
    const supabase = await createClient()

    const { id } = await params

    if (!id || id === "undefined") {
      return NextResponse.json(
        { error: "Invalid store id: " + id },
        { status: 400 }
      )
    }

    const { data: store, error } = await supabase
      .from("stores")
      .update({
        name: storeData.name,
        description: storeData.description,
        extended_description: storeData.extended_description,
        gallery_images: storeData.gallery_images,
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
      .eq("id", id)
      .select()
      .single()
    


    if (error) {
      console.error("Supabase update error:", error)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
        /*if (error) {
          console.error("Store update error:", error)
          return NextResponse.json({ error: "Error al actualizar la tienda" }, { status: 500 })
        }

        return NextResponse.json({ store })*/
      }
 } catch (error: any) {
    console.error("API error:", error)
    console.error("UPDATE STORE ERROR:", error)

  return NextResponse.json(
    {
      error: error.message,
      details: error,
    },
    { status: 500 }
  )
    //return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
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
