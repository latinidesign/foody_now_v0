import { NextRequest, NextResponse } from "next/server"
import * as crypto from "crypto"

export async function POST(request: NextRequest) {
  const privateKeyPem = process.env.QZ_PRIVATE_KEY

  if (!privateKeyPem) {
    return NextResponse.json(
      { error: "QZ_PRIVATE_KEY no está configurada" },
      { status: 500 },
    )
  }

  let body: { toSign?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  if (!body.toSign) {
    return NextResponse.json({ error: "Falta el campo toSign" }, { status: 400 })
  }

  try {
    const sign = crypto.createSign("SHA512")
    sign.update(body.toSign)
    const signature = sign.sign(privateKeyPem, "base64")

    return NextResponse.json({ signature })
  } catch (err) {
    console.error("Error al firmar request QZ Tray:", err)
    return NextResponse.json(
      { error: "Error al firmar el request" },
      { status: 500 },
    )
  }
}
