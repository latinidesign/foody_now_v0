import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const storeData = await request.json()
    const supabase = await createClient()

    // Check if slug is already taken
    const { data: existingStore } = await supabase.from("stores").select("id").eq("slug", storeData.slug).single()

    if (existingStore) {
      return NextResponse.json({ error: "Esta URL ya está en uso" }, { status: 400 })
    }

    // Create the store
    const { data: store, error } = await supabase
      .from("stores")
      .insert({
        owner_id: storeData.owner_id,
        name: storeData.name,
        slug: storeData.slug,
        description: storeData.description || null,
        extended_description: storeData.extended_description || null,
        gallery_images: storeData.gallery_images || [],
        phone: storeData.phone || null,
        email: storeData.email || null,
        address: storeData.address || null,
        delivery_radius: storeData.delivery_radius,
        delivery_fee: storeData.delivery_fee,
        min_order_amount: storeData.min_order_amount,
      })
      .select()
      .single()

    if (error) {
      console.error("Store creation error:", error)
      return NextResponse.json({ error: "Error al crear la tienda" }, { status: 500 })
    }

    // Create default store settings
    await supabase.from("store_settings").insert({
      store_id: store.id,
      is_open: true,
      welcome_message: `¡Bienvenido a ${store.name}!`,
      order_confirmation_message: "Gracias por tu pedido. Te contactaremos pronto.",
    })

    return NextResponse.json({ store })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
