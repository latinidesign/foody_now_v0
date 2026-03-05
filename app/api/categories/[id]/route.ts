import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const urlParams = await params
    const categoryData = await request.json()

    const { data, error } = await supabase
      .from("categories")
      .update({
        name: categoryData.name,
        description: categoryData.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", urlParams.id)
      .select()
      .single()

    if (error) {
      console.error("Category update error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Category update error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const urlParams = await params

    const { error } = await supabase.from("categories").delete().eq("id", urlParams.id)

    if (error) {
      console.error("Category delete error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Category delete error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
